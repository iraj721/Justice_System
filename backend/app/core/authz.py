# backend/app/core/authz.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from app.core.security import decode_token
from app.core.roles import UserRole

bearer_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    token = credentials.credentials
    try:
        payload = decode_token(token)
        email = payload.get("sub")
        role = payload.get("role")
        if not email or not role:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return {"email": email, "role": role, "user_id": payload.get("user_id")}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def get_current_user_ws(token: str) -> dict:
    """WebSocket version - no Depends"""
    try:
        payload = decode_token(token)
        email = payload.get("sub")
        role = payload.get("role")
        if not email or not role:
            raise ValueError("Invalid token")
        return {"email": email, "role": role, "user_id": payload.get("user_id")}
    except JWTError:
        raise ValueError("Invalid token")

def require_roles(*allowed_roles: UserRole):
    allowed = {role.value for role in allowed_roles}
    
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Role {current_user['role']} not permitted")
        return current_user
    
    return role_checker