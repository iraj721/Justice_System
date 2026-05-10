# backend/scripts/generate_encryption_key.py
from cryptography.fernet import Fernet

# Generate a new Fernet key
key = Fernet.generate_key()

print("\n" + "="*60)
print("🔑 YOUR ENCRYPTION KEY (COPY THIS EXACTLY):")
print("="*60)
print(key.decode())
print("="*60)
print("\n⚠️  CRITICAL: Save this key somewhere safe!")
print("⚠️  Without it, you cannot decrypt evidence files!\n")