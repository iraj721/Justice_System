# backend/app/api/websocket.py 
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends, HTTPException
from typing import Dict, Set, Any, Optional
import json
import asyncio
from datetime import datetime, timezone
import logging

from app.core.security import decode_token
from app.services.mongo_storage import mongo_storage
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])

class ConnectionManager:
    """Real-time connection manager"""
    def __init__(self):
        # case_id -> set of websockets
        self.case_connections: Dict[str, Set[WebSocket]] = {}
        # user_email -> set of websockets
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        # role -> set of websockets (for role-based broadcasts)
        self.role_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, case_id: str = None, user_email: str = None, role: str = None):
        await websocket.accept()
        
        if case_id:
            if case_id not in self.case_connections:
                self.case_connections[case_id] = set()
            self.case_connections[case_id].add(websocket)
        
        if user_email:
            if user_email not in self.user_connections:
                self.user_connections[user_email] = set()
            self.user_connections[user_email].add(websocket)
        
        if role:
            if role not in self.role_connections:
                self.role_connections[role] = set()
            self.role_connections[role].add(websocket)
    
    def disconnect(self, websocket: WebSocket, case_id: str = None, user_email: str = None, role: str = None):
        if case_id and case_id in self.case_connections:
            self.case_connections[case_id].discard(websocket)
            if not self.case_connections[case_id]:
                del self.case_connections[case_id]
        
        if user_email and user_email in self.user_connections:
            self.user_connections[user_email].discard(websocket)
            if not self.user_connections[user_email]:
                del self.user_connections[user_email]
        
        if role and role in self.role_connections:
            self.role_connections[role].discard(websocket)
            if not self.role_connections[role]:
                del self.role_connections[role]
    
    async def send_case_update(self, case_id: str, update_type: str, data: Any):
        """Send update to all clients watching a case"""
        message = {
            "type": update_type,
            "case_id": case_id,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        if case_id in self.case_connections:
            disconnected = []
            for connection in self.case_connections[case_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.disconnect(conn, case_id=case_id)
    
    async def send_user_update(self, user_email: str, update_type: str, data: Any):
        """Send update to specific user"""
        message = {
            "type": update_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        if user_email in self.user_connections:
            disconnected = []
            for connection in self.user_connections[user_email]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.disconnect(conn, user_email=user_email)
    
    async def broadcast_to_role(self, role: str, update_type: str, data: Any):
        """Broadcast to all users with specific role"""
        message = {
            "type": update_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        if role in self.role_connections:
            disconnected = []
            for connection in self.role_connections[role]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.disconnect(conn, role=role)

manager = ConnectionManager()

async def get_user_from_token(token: str) -> Optional[dict]:
    """Extract user info from token"""
    try:
        payload = decode_token(token)
        return {
            "email": payload.get("sub"),
            "role": payload.get("role"),
            "user_id": payload.get("user_id")
        }
    except Exception:
        return None

@router.websocket("/ws/case/{case_id}")
async def case_websocket(websocket: WebSocket, case_id: str):
    """WebSocket for real-time case updates"""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    current_user = await get_user_from_token(token)
    if not current_user:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    # Verify access
    case = await mongo_storage.get_case(case_id)
    if not case:
        await websocket.close(code=1004, reason="Case not found")
        return
    
    await manager.connect(websocket, case_id=case_id, user_email=current_user["email"])
    
    # Send initial state
    await websocket.send_json({
        "type": "connected",
        "case_id": case_id,
        "data": {
            "status": case.get("status"),
            "message": "Connected to real-time updates"
        }
    })
    
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
            elif data == "refresh":
                fresh_case = await mongo_storage.get_case(case_id)
                await websocket.send_json({
                    "type": "case_update",
                    "data": fresh_case
                })
            elif data.startswith("subscribe:"):
                # Subscribe to additional notifications
                pass
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, case_id=case_id, user_email=current_user["email"])

@router.websocket("/ws/user")
async def user_websocket(websocket: WebSocket):
    """WebSocket for user notifications"""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    current_user = await get_user_from_token(token)
    if not current_user:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    await manager.connect(websocket, user_email=current_user["email"], role=current_user["role"])
    
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_email=current_user["email"], role=current_user["role"])

# Helper functions for sending notifications
async def notify_case_update(case_id: str, update_type: str, data: Any):
    await manager.send_case_update(case_id, update_type, data)

async def notify_user(user_email: str, message: str, data: Any = None):
    await manager.send_user_update(user_email, "notification", {
        "message": message,
        "data": data
    })

async def notify_investigators(message: str, data: Any = None):
    await manager.broadcast_to_role("INVESTIGATOR", "notification", {
        "message": message,
        "data": data
    })