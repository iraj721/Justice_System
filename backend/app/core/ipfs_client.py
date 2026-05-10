import json
import hashlib
import logging
import requests
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class IPFSClient:
    def __init__(self):
        self.api_url = settings.IPFS_API_URL  # http://127.0.0.1:5002
        self.gateway_url = settings.IPFS_GATEWAY_URL  # https://dweb.link
        
    async def upload_json(self, data: Dict[str, Any]) -> str:
        """Upload JSON data to IPFS using HTTP API"""
        try:
            json_str = json.dumps(data, default=str, indent=2)
            files = {'file': ('data.json', json_str, 'application/json')}
            
            logger.info("Uploading JSON to IPFS API: %s/api/v0/add", self.api_url)
            response = requests.post(
                f"{self.api_url}/api/v0/add",
                files=files,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                cid = result.get('Hash', '')
                logger.info("IPFS JSON upload success CID=%s", cid)
                return cid
            else:
                logger.error(
                    "IPFS upload failed HTTP %s response=%s",
                    response.status_code,
                    response.text[:500],
                )
                # Don't fallback to fake hash - raise error
                raise Exception(f"IPFS upload failed: {response.status_code}")
                
        except requests.exceptions.ConnectionError as e:
            logger.error("Cannot connect to IPFS daemon at %s: %s", self.api_url, e)
            raise Exception("IPFS daemon not running") from e

        except Exception as e:
            logger.exception("IPFS upload error: %s", e)
            raise Exception(f"IPFS upload failed: {e}") from e
    
    async def upload_file(self, file_content: bytes, filename: str = None) -> Dict[str, str]:
        """Upload file to IPFS"""
        try:
            files = {'file': (filename or 'file', file_content)}
            response = requests.post(
                f"{self.api_url}/api/v0/add",
                files=files,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "cid": result.get('Hash', ''),
                    "size": result.get('Size', 0),
                    "gateway_url": f"{self.gateway_url}/ipfs/{result.get('Hash', '')}"
                }
            else:
                raise Exception(f"Upload failed: {response.status_code}")
        except Exception as e:
            logger.exception("IPFS file upload error: %s", e)
            raise
    
    async def get_json(self, cid: str) -> Dict[str, Any]:
        """Get JSON data from IPFS"""
        try:
            response = requests.get(f"{self.gateway_url}/ipfs/{cid}", timeout=30)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.warning("IPFS get error for cid=%s: %s", cid, e)
        return {}
    
    def generate_hash(self, data: Any) -> str:
        """Generate SHA-256 hash of any data"""
        json_str = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(json_str.encode()).hexdigest()


ipfs_client = IPFSClient()