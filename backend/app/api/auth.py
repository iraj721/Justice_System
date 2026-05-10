# backend/app/api/auth.py
from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
import uuid
import sqlite3
import json
import os
from typing import Optional

from app.core.security import hash_password, verify_password, create_access_token
from app.core.roles import UserRole, RESTRICTED_ROLES, ONBOARDING_CODES
from app.core.authz import get_current_user
from app.core.config import settings
from app.services.ipfs_storage import ipfs_storage
from app.core.ipfs_client import ipfs_client

# NEW: Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import Field, field_validator
import re
from app.services.email_service import email_service

temp_storage = {}


limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["auth"])

# SQLite database for users (passwords only - separate from main storage)
USER_DB_PATH = "data/users_auth.db"

def init_auth_db():
    """Initialize authentication database with proper schema"""
    os.makedirs(os.path.dirname(USER_DB_PATH), exist_ok=True)
    conn = sqlite3.connect(USER_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            salt TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            failed_login_attempts INTEGER DEFAULT 0,
            locked_until TEXT NULL,
            last_login_at TEXT NULL
        )
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    """)
    conn.commit()
    conn.close()

init_auth_db()

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.PUBLIC_USER
    onboarding_code: str | None = None
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        # At least 8 characters
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        # At least one uppercase letter
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        
        # At least one lowercase letter
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        
        # At least one digit
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        
        # At least one special character
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*)')
        
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    full_name: str
    email: str
    ipfs_cid: str = ""
    hash: str = ""

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    created_at: str
    ipfs_cid: str = ""
    hash: str = ""

def store_password(email: str, password_hash: str):
    """Store password hash in SQLite database"""
    conn = sqlite3.connect(USER_DB_PATH)
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
        INSERT OR REPLACE INTO users (email, password_hash, created_at, updated_at)
        VALUES (?, ?, COALESCE((SELECT created_at FROM users WHERE email = ?), ?), ?)
    """, (email, password_hash, email, now, now))
    conn.commit()
    conn.close()

def get_password_hash(email: str) -> Optional[str]:
    """Get password hash from SQLite database"""
    conn = sqlite3.connect(USER_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def update_failed_login(email: str, success: bool):
    """Track failed login attempts for brute force protection"""
    conn = sqlite3.connect(USER_DB_PATH)
    cursor = conn.cursor()
    
    if success:
        # Reset on successful login
        cursor.execute("""
            UPDATE users 
            SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ?
            WHERE email = ?
        """, (datetime.now(timezone.utc).isoformat(), email))
    else:
        # Increment failed attempts
        cursor.execute("""
            UPDATE users 
            SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
                locked_until = CASE 
                    WHEN COALESCE(failed_login_attempts, 0) + 1 >= 5 
                    THEN datetime('now', '+15 minutes')
                    ELSE NULL
                END
            WHERE email = ?
        """, (email,))
    
    conn.commit()
    conn.close()

def is_account_locked(email: str) -> bool:
    """Check if account is locked due to too many failed attempts"""
    conn = sqlite3.connect(USER_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT locked_until FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    
    if row and row[0]:
        locked_until = datetime.fromisoformat(row[0])
        if locked_until > datetime.now(timezone.utc):
            return True
    return False

# ============ NEW: Request OTP ============
class OTPRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.PUBLIC_USER
    onboarding_code: str | None = None

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

@router.post("/send-otp")
@limiter.limit("3/minute")
async def send_verification_otp(request: Request, payload: OTPRequest):
    """Send OTP to email for verification"""
    
    # Check if email already registered
    existing_user = ipfs_storage.get_user(payload.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password strength
    password_errors = []
    if len(payload.password) < 8:
        password_errors.append("At least 8 characters")
    if not re.search(r'[A-Z]', payload.password):
        password_errors.append("One uppercase letter")
    if not re.search(r'[a-z]', payload.password):
        password_errors.append("One lowercase letter")
    if not re.search(r'\d', payload.password):
        password_errors.append("One number")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', payload.password):
        password_errors.append("One special character (!@#$%^&*)")
    
    if password_errors:
        raise HTTPException(
            status_code=400,
            detail=f"Password requirements: {', '.join(password_errors)}"
        )
    
    # Validate email domain (optional)
    allowed_domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
    email_domain = payload.email.split('@')[-1].lower()
    if email_domain not in allowed_domains:
        raise HTTPException(
            status_code=400,
            detail=f"Email domain '{email_domain}' not allowed. Use: {', '.join(allowed_domains)}"
        )
    
    # Generate and send OTP
    otp = email_service.generate_otp()
    success = await email_service.send_otp_email(payload.email, otp)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send verification email")
    
    # Store OTP with user data
    email_service.store_otp(payload.email, otp)
    
    # Store registration data temporarily
    temp_storage[payload.email] = {
        "full_name": payload.full_name,
        "password": payload.password,
        "role": payload.role,
        "onboarding_code": payload.onboarding_code
    }
    
    return {
        "success": True,
        "message": f"Verification code sent to {payload.email}",
        "email": payload.email
    }


# ============ NEW: Verify OTP and Complete Registration ============
@router.post("/verify-otp", response_model=AuthResponse)
@limiter.limit("5/minute")
async def verify_and_register(request: Request, payload: OTPVerifyRequest):
    """Verify OTP and complete registration"""
    
    # Verify OTP
    if not email_service.verify_otp(payload.email, payload.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Get temporary registration data
    reg_data = temp_storage.get(payload.email)
    if not reg_data:
        raise HTTPException(status_code=400, detail="Registration session expired. Please try again.")
    
    # Check if user exists (in case someone registered while OTP was pending)
    existing_user = ipfs_storage.get_user(payload.email)
    if existing_user:
        del temp_storage[payload.email]
        email_service.clear_otp(payload.email)
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check onboarding code for restricted roles
    role = reg_data["role"]
    if role in RESTRICTED_ROLES:
        expected_code = ONBOARDING_CODES.get(role)
        if not reg_data.get("onboarding_code") or reg_data["onboarding_code"] != expected_code:
            raise HTTPException(
                status_code=403,
                detail=f"Valid onboarding code required for {role.value}"
            )
    
    # Create user
    user_id = str(uuid.uuid4())
    password_hash = hash_password(reg_data["password"])
    store_password(payload.email, password_hash)
    
    user_data = {
        "id": user_id,
        "full_name": reg_data["full_name"],
        "email": payload.email,
        "role": role.value,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upload to IPFS
    try:
        user_cid = await ipfs_client.upload_json(user_data)
        user_hash = ipfs_client.generate_hash(user_data)
        user_data["ipfs_cid"] = user_cid
        user_data["hash"] = user_hash
    except Exception as e:
        print(f"IPFS upload failed: {e}")
        user_data["ipfs_cid"] = "UPLOAD_FAILED"
        user_data["hash"] = ipfs_client.generate_hash(user_data)
    
    ipfs_storage.save_user(payload.email, user_data)
    
        # ============ REGISTER ON BLOCKCHAIN ============
    try:
        from web3 import Web3
        
        w3 = Web3(Web3.HTTPProvider(settings.CHAIN_RPC_URL))
        print(f"🔗 Blockchain connected: {w3.is_connected()}")
        
        if w3.is_connected():
            contract_address = Web3.to_checksum_address(settings.CHAIN_CONTRACT_ADDRESS)
            
            contract_abi = [{
                "inputs": [
                    {"internalType": "uint8", "name": "role", "type": "uint8"},
                    {"internalType": "bytes32", "name": "emailHash", "type": "bytes32"},
                    {"internalType": "bytes32", "name": "ipfsCid", "type": "bytes32"}
                ],
                "name": "registerUser",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }]
            
            contract = w3.eth.contract(address=contract_address, abi=contract_abi)
            account = w3.eth.account.from_key(settings.CHAIN_PRIVATE_KEY)
            
            role_map = {"PUBLIC_USER": 1, "INVESTIGATOR": 2, "FORENSIC_ANALYST": 3, "COURT": 4}
            role_num = role_map.get(role.value, 1)
            
            email_hash = Web3.keccak(text=payload.email)
            ipfs_cid_hash = Web3.keccak(text=user_data.get("ipfs_cid", ""))
            
            nonce = w3.eth.get_transaction_count(account.address)
            tx = contract.functions.registerUser(role_num, email_hash, ipfs_cid_hash).build_transaction({
                "from": account.address,
                "nonce": nonce,
                "gas": 200000,
                "gasPrice": w3.to_wei(20, "gwei")
            })
            
            signed = account.sign_transaction(tx)
            tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
            
            # FIXED: tx_hash is already a string or bytes, handle both cases
            if hasattr(tx_hash, 'hex'):
                print(f"✅ User registered on blockchain: {tx_hash.hex()}")
            else:
                print(f"✅ User registered on blockchain: {tx_hash}")
                
    except Exception as e:
        print(f"⚠️ Blockchain registration failed: {e}")
    # ============ END BLOCKCHAIN REGISTRATION ============
    
    # Clear temp data
    del temp_storage[payload.email]
    email_service.clear_otp(payload.email)
    
    # Create token
    token = create_access_token({
        "sub": payload.email,
        "role": role.value,
        "user_id": user_id
    })
    
    return AuthResponse(
        access_token=token,
        role=role,
        full_name=reg_data["full_name"],
        email=payload.email,
        ipfs_cid=user_data.get("ipfs_cid", ""),
        hash=user_data.get("hash", "")
    )


# ============ NEW: Resend OTP ============
class ResendOTPRequest(BaseModel):
    email: EmailStr

@router.post("/resend-otp")
@limiter.limit("2/minute")
async def resend_otp(request: Request, payload: ResendOTPRequest):
    """Resend verification OTP"""
    
    reg_data = temp_storage.get(payload.email)
    if not reg_data:
        raise HTTPException(status_code=400, detail="No pending registration found")
    
    otp = email_service.generate_otp()
    success = await email_service.send_otp_email(payload.email, otp)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send verification email")
    
    email_service.store_otp(payload.email, otp)
    
    return {"success": True, "message": f"New verification code sent to {payload.email}"}

@router.post("/register", response_model=AuthResponse)
@limiter.limit("10/minute")  # Rate limit registration
async def register(request: Request, payload: RegisterRequest):
    """Register new user with database password storage"""
    
    # Check if user exists in IPFS
    existing_user = ipfs_storage.get_user(payload.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # ============ NEW: Validate email domain ============
    # Allow only gmail.com, yahoo.com, outlook.com, etc.
    allowed_domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
    email_domain = payload.email.split('@')[-1].lower()

    # Check if domain is allowed
    if email_domain not in allowed_domains:
        raise HTTPException(
            status_code=400, 
            detail=f"Email domain '{email_domain}' not allowed. Use: {', '.join(allowed_domains)}"
        )
    
    # Check onboarding code for restricted roles
    if payload.role in RESTRICTED_ROLES:
        expected_code = ONBOARDING_CODES.get(payload.role)
        if not payload.onboarding_code or payload.onboarding_code != expected_code:
            raise HTTPException(
                status_code=403,
                detail=f"Valid onboarding code required for {payload.role.value}"
            )
    
    user_id = str(uuid.uuid4())
    
    # Store password hash in SQLite database (not JSON file)
    password_hash = hash_password(payload.password)
    store_password(payload.email, password_hash)
    
    user_data = {
        "id": user_id,
        "full_name": payload.full_name,
        "email": payload.email,
        "role": payload.role.value,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upload user to IPFS
    user_cid = await ipfs_client.upload_json(user_data)
    user_hash = ipfs_client.generate_hash(user_data)
    user_data["ipfs_cid"] = user_cid
    user_data["hash"] = user_hash
    
    # Store on IPFS
    ipfs_storage.save_user(payload.email, user_data)
    
    token = create_access_token({
        "sub": payload.email,
        "role": payload.role.value,
        "user_id": user_id
    })
    
    return AuthResponse(
        access_token=token,
        role=payload.role,
        full_name=payload.full_name,
        email=payload.email,
        ipfs_cid=user_cid,
        hash=user_hash
    )

@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")  # Rate limit: max 5 attempts per minute
async def login(request: Request, payload: LoginRequest):
    """Login with rate limiting and account lockout protection"""
    
    # Check if account is locked
    if is_account_locked(payload.email):
        raise HTTPException(
            status_code=429,
            detail="Account temporarily locked due to too many failed attempts. Try again after 15 minutes."
        )
    
    # Get user from IPFS
    user = ipfs_storage.get_user(payload.email)
    if not user:
        update_failed_login(payload.email, False)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Get password hash from SQLite database
    password_hash = get_password_hash(payload.email)
    
    if not password_hash or not verify_password(payload.password, password_hash):
        update_failed_login(payload.email, False)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Successful login - reset failed attempts
    update_failed_login(payload.email, True)
    
    token = create_access_token({
        "sub": user["email"],
        "role": user["role"],
        "user_id": user["id"]
    })
    
    return AuthResponse(
        access_token=token,
        role=UserRole(user["role"]),
        full_name=user["full_name"],
        email=user["email"],
        ipfs_cid=user.get("ipfs_cid", ""),
        hash=user.get("hash", "")
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = ipfs_storage.get_user(current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=UserRole(user["role"]),
        created_at=user["created_at"],
        ipfs_cid=user.get("ipfs_cid", ""),
        hash=user.get("hash", "")
    )