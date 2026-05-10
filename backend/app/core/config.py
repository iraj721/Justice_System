# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")  # ADD extra="ignore"
    
    SECRET_KEY: str = "change-this-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Comma-separated origins
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:5174,http://127.0.0.1:5174"
    )

    # JSON + SQLite data directory
    DATA_DIR: str = "data"

    # Secondary SQLite index
    USE_SQLITE_INDEX: bool = True
    SQLITE_PATH: str = "data/justice_index.sqlite3"

    # Local password hashes
    PASSWORD_STORE_PATH: str = "passwords.json"

    # Optional: upload custody event bundles to IPFS
    ENABLE_CUSTODY_IPFS_SNAPSHOTS: bool = True

    # Optional: anchor hashes on-chain
    ENABLE_CHAIN_ANCHORING: bool = True
    CHAIN_RPC_URL: str = "http://127.0.0.1:7545"
    CHAIN_PRIVATE_KEY: str = ""
    CHAIN_CONTRACT_ADDRESS: str = ""
    CHAIN_CHAIN_ID: int = 1337

    # IPFS Configuration
    IPFS_API_URL: str = "http://127.0.0.1:5002"
    IPFS_GATEWAY_URL: str = "http://127.0.0.1:8080"
    IPFS_FALLBACK_GATEWAY: str = "https://dweb.link"
    
    # Pinata for production IPFS
    PINATA_API_KEY: str = ""
    PINATA_SECRET_KEY: str = ""
    
    # Evidence encryption
    EVIDENCE_ENCRYPTION_KEY: str = ""
    
    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60
    
    # WebSocket settings
    WS_HEARTBEAT_INTERVAL: int = 30

    # ============ NEW: SMS (Twilio) ============
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # ============ NEW: Video Conferencing (Agora) ============
    AGORA_APP_ID: str = ""
    AGORA_APP_CERTIFICATE: str = ""

    # ============ NEW: Payment Gateway ============
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    EASYPAISA_CLIENT_ID: str = ""
    EASYPAISA_CLIENT_SECRET: str = ""
    
    # Base URL for callbacks
    BASE_URL: str = "http://localhost:8000"


settings = Settings()