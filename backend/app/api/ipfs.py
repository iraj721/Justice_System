from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List
import requests
from app.core.authz import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/ipfs", tags=["IPFS"])

@router.post("/upload")
async def upload_to_ipfs(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload file to IPFS via backend (bypasses CORS)"""
    try:
        # Read file content
        content = await file.read()
        
        # Upload to IPFS daemon
        files = {'file': (file.filename, content, file.content_type)}
        response = requests.post(
            f"{settings.IPFS_API_URL}/api/v0/add",
            files=files,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            return {
                "success": True,
                "cid": result.get("Hash"),
                "size": result.get("Size"),
                "name": file.filename,
                "url": f"{settings.IPFS_GATEWAY_URL}/ipfs/{result.get('Hash')}"
            }
        else:
            raise HTTPException(status_code=500, detail="IPFS upload failed")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-multiple")
async def upload_multiple_to_ipfs(
    files: List[UploadFile],
    current_user: dict = Depends(get_current_user)
):
    """Upload multiple files to IPFS"""
    results = []
    for file in files:
        content = await file.read()
        files_data = {'file': (file.filename, content, file.content_type)}
        response = requests.post(f"{settings.IPFS_API_URL}/api/v0/add", files=files_data)
        
        if response.status_code == 200:
            result = response.json()
            results.append({
                "success": True,
                "cid": result.get("Hash"),
                "name": file.filename,
                "url": f"{settings.IPFS_GATEWAY_URL}/ipfs/{result.get('Hash')}"
            })
    
    return results