# backend/scripts/verify_keys.py
import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

# Load .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

print("\n" + "="*60)
print("🔍 VERIFYING ALL KEYS")
print("="*60)

# Check Encryption Key
enc_key = os.getenv("EVIDENCE_ENCRYPTION_KEY")
if enc_key:
    try:
        f = Fernet(enc_key.encode())
        test_data = b"Hello Justice System!"
        encrypted = f.encrypt(test_data)
        decrypted = f.decrypt(encrypted)
        
        if decrypted == test_data:
            print("✅ ENCRYPTION KEY: Valid and working!")
            print(f"   Key: {enc_key[:20]}...")
        else:
            print("❌ ENCRYPTION KEY: Test failed")
    except Exception as e:
        print(f"❌ ENCRYPTION KEY: Invalid - {e}")
else:
    print("❌ ENCRYPTION KEY: Not found in .env")

# Check Pinata Keys
pinata_key = os.getenv("PINATA_API_KEY")
pinata_secret = os.getenv("PINATA_SECRET_KEY")

if pinata_key and pinata_secret:
    print(f"✅ PINATA_API_KEY: {pinata_key[:10]}...")
    print(f"✅ PINATA_SECRET_KEY: {pinata_secret[:10]}...")
else:
    print("❌ PINATA KEYS: Missing or incomplete")

print("\n" + "="*60)
print("🎉 Verification Complete!")
print("="*60 + "\n")