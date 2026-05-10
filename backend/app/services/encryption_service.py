# backend/app/services/encryption_service.py
"""Evidence encryption/decryption service"""
from cryptography.fernet import Fernet
import base64
import os
from typing import Optional, Tuple
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Try to import PBKDF2 with fallback for different versions
try:
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
except ImportError:
    try:
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC as PBKDF2
    except ImportError:
        # Fallback - create a simple PBKDF2 implementation
        import hashlib
        class PBKDF2:
            def __init__(self, algorithm, length, salt, iterations):
                self.algorithm = algorithm
                self.length = length
                self.salt = salt
                self.iterations = iterations
            
            def derive(self, password):
                return hashlib.pbkdf2_hmac(
                    'sha256', 
                    password, 
                    self.salt, 
                    self.iterations, 
                    self.length
                )

try:
    from cryptography.hazmat.primitives import hashes
    HASHES_AVAILABLE = True
except ImportError:
    HASHES_AVAILABLE = False
    logger.warning("cryptography.hazmat.primitives.hashes not available")

class EncryptionService:
    def __init__(self):
        self.encryption_enabled = bool(settings.EVIDENCE_ENCRYPTION_KEY)
        if self.encryption_enabled:
            try:
                self.cipher = Fernet(settings.EVIDENCE_ENCRYPTION_KEY.encode())
                logger.info("Evidence encryption enabled")
            except Exception as e:
                logger.error(f"Failed to initialize encryption: {e}")
                self.encryption_enabled = False
        else:
            logger.warning("Evidence encryption disabled - set EVIDENCE_ENCRYPTION_KEY to enable")
    
    @staticmethod
    def generate_key() -> str:
        """Generate a new encryption key"""
        return Fernet.generate_key().decode()
    
    @staticmethod
    def generate_key_from_password(password: str, salt: bytes = None) -> Tuple[str, bytes]:
        """Generate key from password (for key management)"""
        if salt is None:
            salt = os.urandom(16)
        
        try:
            # Try using PBKDF2HMAC
            from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
            from cryptography.hazmat.primitives import hashes
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
            return key.decode(), salt
        except ImportError:
            # Fallback to hashlib
            import hashlib
            key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000, 32)
            key_b64 = base64.urlsafe_b64encode(key).decode()
            return key_b64, salt
    
    def encrypt(self, data: bytes) -> Optional[bytes]:
        """Encrypt data"""
        if not self.encryption_enabled:
            return data
        
        try:
            return self.cipher.encrypt(data)
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            return None
    
    def decrypt(self, encrypted_data: bytes) -> Optional[bytes]:
        """Decrypt data"""
        if not self.encryption_enabled:
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