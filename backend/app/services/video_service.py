# backend/app/services/video_service.py
import logging
import random
import string
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import json
import os

from app.core.config import settings

logger = logging.getLogger(__name__)

# Try to import Agora token generator
try:
    from agora_token_builder import RtcTokenBuilder
    AGORA_AVAILABLE = True
except ImportError:
    AGORA_AVAILABLE = False
    logger.warning("Agora token builder not installed. Video features disabled.")

class VideoConferenceService:
    def __init__(self):
        self.enabled = AGORA_AVAILABLE and settings.AGORA_APP_ID
        if self.enabled:
            self.app_id = settings.AGORA_APP_ID
            self.certificate = settings.AGORA_APP_CERTIFICATE
            logger.info("Video conferencing service enabled")
        else:
            logger.warning("Video conferencing disabled - install agora_token_builder")
    
    def generate_meeting_id(self) -> str:
        """Generate unique meeting ID"""
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    
    def generate_token(self, channel_name: str, user_id: str, role: int = 1) -> Optional[str]:
        """Generate Agora token for video meeting"""
        if not self.enabled:
            return None
        
        try:
            # Role: 1 = publisher, 2 = subscriber
            expire_time = int((datetime.now() + timedelta(hours=24)).timestamp())
            token = RtcTokenBuilder.buildTokenWithUid(
                self.app_id, self.certificate, channel_name, 0, role, expire_time
            )
            return token
        except Exception as e:
            logger.error(f"Failed to generate token: {e}")
            return None
    
    def create_meeting(self, case_id: str, meeting_type: str = "hearing") -> Dict[str, Any]:
        """Create a new video meeting"""
        meeting_id = self.generate_meeting_id()
        channel_name = f"justice_{case_id}_{meeting_id}"
        
        meeting_data = {
            "meeting_id": meeting_id,
            "channel_name": channel_name,
            "case_id": case_id,
            "meeting_type": meeting_type,
            "created_at": datetime.now().isoformat(),
            "status": "active",
            "agora_app_id": self.app_id if self.enabled else None
        }
        
        return meeting_data
    
    def get_meeting_link(self, meeting_id: str, user_role: str) -> str:
        """Get meeting join link (frontend route)"""
        return f"/video-call/{meeting_id}?role={user_role}"
    
    def get_token_for_user(self, meeting_id: str, user_id: str, user_role: str) -> Optional[str]:
        """Get token for specific user"""
        channel_name = f"justice_meeting_{meeting_id}"
        # Judge gets publisher role, others get subscriber
        role = 1 if user_role == "COURT" else 2
        return self.generate_token(channel_name, user_id, role)

video_service = VideoConferenceService()