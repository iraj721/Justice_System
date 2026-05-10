import hashlib
import json
from typing import Any

def generate_hash(data: Any) -> str:
    """Generate SHA-256 hash of any JSON-serializable data"""
    json_str = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(json_str.encode()).hexdigest()

def verify_hash(data: Any, expected_hash: str) -> bool:
    """Verify if data matches the expected hash"""
    return generate_hash(data) == expected_hash