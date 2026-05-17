"""Evidence encryption/decryption service - Simplified (optional)"""
import base64
import os
from typing import Optional, Tuple
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class EncryptionService:
    def __init__(self):
        # Encryption disabled by default (optional feature)
        self.encryption_enabled = False
        self.cipher = None
        
        # Check if encryption key is set in settings
        encryption_key = getattr(settings, 'EVIDENCE_ENCRYPTION_KEY', None)
        if encryption_key:
            try:
                from cryptography.fernet import Fernet
                self.cipher = Fernet(encryption_key.encode())
                self.encryption_enabled = True
                logger.info("Evidence encryption enabled")
            except Exception as e:
                logger.error(f"Failed to initialize encryption: {e}")
                self.encryption_enabled = False
        else:
            logger.warning("Evidence encryption disabled - set EVIDENCE_ENCRYPTION_KEY to enable")
    
    @staticmethod
    def generate_key() -> str:
        """Generate a new encryption key"""
        try:
            from cryptography.fernet import Fernet
            return Fernet.generate_key().decode()
        except ImportError:
            return "ENCRYPTION_NOT_AVAILABLE"
    
    def encrypt(self, data: bytes) -> Optional[bytes]:
        """Encrypt data"""
        if not self.encryption_enabled or not self.cipher:
            return data
        try:
            return self.cipher.encrypt(data)
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            return None
    
    def decrypt(self, encrypted_data: bytes) -> Optional[bytes]:
        """Decrypt data"""
        if not self.encryption_enabled or not self.cipher:
            return encrypted_data
        try:
            return self.cipher.decrypt(encrypted_data)
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return None
    
    def encrypt_file(self, file_path: str, output_path: str = None) -> Optional[str]:
        """Encrypt a file"""
        if not self.encryption_enabled:
            return file_path
        try:
            with open(file_path, 'rb') as f:
                data = f.read()
            encrypted = self.encrypt(data)
            if encrypted is None:
                return None
            output = output_path or f"{file_path}.encrypted"
            with open(output, 'wb') as f:
                f.write(encrypted)
            return output
        except Exception as e:
            logger.error(f"File encryption failed: {e}")
            return None

encryption_service = EncryptionService()