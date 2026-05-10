# backend/app/services/pinata_service.py
"""Pinata IPFS pinning service for production"""
import requests
import json
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class PinataService:
    def __init__(self):
        self.api_key = settings.PINATA_API_KEY
        self.secret_key = settings.PINATA_SECRET_KEY
        self.enabled = bool(self.api_key and self.secret_key)
        
        if self.enabled:
            self.headers = {
                "pinata_api_key": self.api_key,
                "pinata_secret_api_key": self.secret_key,
                "Content-Type": "application/json"
            }
            logger.info("Pinata service enabled")
        else:
            logger.warning("Pinata service disabled - set PINATA_API_KEY and PINATA_SECRET_KEY")
    
    async def pin_file(self, file_content: bytes, filename: str) -> Optional[str]:
        """Pin file to IPFS via Pinata"""
        if not self.enabled:
            return None
        
        try:
            files = {
                'file': (filename, file_content)
            }
            
            response = requests.post(
                "https://api.pinata.cloud/pinning/pinFileToIPFS",
                files=files,
                headers={"pinata_api_key": self.api_key, "pinata_secret_api_key": self.secret_key}
            )
            
            if response.status_code == 200:
                result = response.json()
                cid = result.get("IpfsHash")
                logger.info(f"Pinned file to Pinata: {cid}")
                return cid
            else:
                logger.error(f"Pinata pin failed: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Pinata error: {e}")
            return None
    
    async def pin_json(self, data: Dict[str, Any]) -> Optional[str]:
        """Pin JSON to IPFS via Pinata"""
        if not self.enabled:
            return None
        
        try:
            response = requests.post(
                "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                json={
                    "pinataContent": data,
                    "pinataMetadata": {"name": "justice_record"}
                },
                headers=self.headers
            )
            
            if response.status_code == 200:
                result = response.json()
                cid = result.get("IpfsHash")
                logger.info(f"Pinned JSON to Pinata: {cid}")
                return cid
            else:
                logger.error(f"Pinata pin failed: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Pinata error: {e}")
            return None

pinata_service = PinataService()