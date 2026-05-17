# backend/app/api/documents.py
import hashlib
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
import uuid
from datetime import datetime, timezone
from app.core.authz import get_current_user, require_roles
from app.core.roles import UserRole
from app.core.config import settings
from app.services.mongo_storage import mongo_storage
from app.services.cloudinary_service import cloudinary_service

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload")
async def upload_document(
    title: str = Form(...),
    description: str = Form(""),
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload personal documents (CNIC, address proof, etc.) to Cloudinary"""
    # Validate file size (max 10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB")
    
    # Calculate content hash
    content_hash = hashlib.sha256(content).hexdigest()
    
    # Upload to Cloudinary
    cloudinary_result = await cloudinary_service.upload_file(
        content,
        file.filename or "document",
        folder=f"documents/{current_user['email']}"
    )
    
    if not cloudinary_result.get("url"):
        raise HTTPException(status_code=500, detail="Cloudinary upload failed")
    
    doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    
    document = {
        "doc_id": doc_id,
        "user_email": current_user["email"],
        "title": title,
        "description": description,
        "doc_type": doc_type,
        "filename": file.filename,
        "file_size": len(content),
        "mime_type": file.content_type or "application/octet-stream",
        "content_hash": content_hash,
        "cloudinary_url": cloudinary_result["url"],
        "cloudinary_public_id": cloudinary_result["public_id"],
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await mongo_storage.save_user_document(current_user["email"], doc_id, document)
    
    return {
        "doc_id": doc_id,
        "cloudinary_url": cloudinary_result["url"],
        "message": "Document uploaded successfully"
    }


@router.get("/my-documents")
async def get_my_documents(current_user: dict = Depends(get_current_user)):
    """Get all user documents"""
    return await mongo_storage.get_user_documents(current_user["email"])


@router.get("/types")
async def get_document_types():
    """Get available document types"""
    return {
        "types": ["CNIC", "PASSPORT", "ADDRESS_PROOF", "INCOME_PROOF", "OTHER"]
    }


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a document"""
    await mongo_storage.delete_user_document(current_user["email"], doc_id)
    return {"message": "Document deleted"}


@router.post("/submit-to-case/{doc_id}")
async def submit_document_to_case(
    doc_id: str,
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Submit user document as evidence to a case (user action)"""
    
    # Get the document
    user_docs = await mongo_storage.get_user_documents(current_user["email"])
    document = None
    for doc in user_docs:
        if doc.get("doc_id") == doc_id:
            document = doc
            break
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get the case
    case = await mongo_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Verify user owns this case (through FIR)
    fir = await mongo_storage.get_fir(case.get("fir_id"))
    if not fir or fir.get("complainant_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your case")
    
    # Create evidence from document
    evidence_id = f"EVD-{uuid.uuid4().hex[:10].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    evidence_data = {
        "evidence_id": evidence_id,
        "case_id": case_id,
        "title": document.get("title"),
        "description": f"User submitted document: {document.get('description', '')}",
        "cloudinary_url": document.get("cloudinary_url"),
        "hash": document.get("content_hash"),
        "file_size": document.get("file_size"),
        "mime_type": document.get("mime_type"),
        "original_filename": document.get("filename"),
        "created_by": current_user["email"],
        "created_by_name": current_user.get("full_name"),
        "status": "PENDING_REVIEW",  # Needs investigator review
        "submitted_at": now,
        "source": "USER_DOCUMENT",
        "original_doc_id": doc_id,
        "created_at": now,
        "updated_at": now
    }
    
    await mongo_storage.save_evidence(evidence_id, evidence_data)
    
    # Add to case
    if "evidence" not in case:
        case["evidence"] = []
    case["evidence"].append(evidence_id)
    case["updated_at"] = now
    await mongo_storage.update_case(case_id, case)
    
    # Add to timeline
    if "timeline" not in case:
        case["timeline"] = []
    case["timeline"].append({
        "action": f"Document '{document.get('title')}' submitted as evidence by user",
        "timestamp": now,
        "by": current_user["email"],
        "by_name": current_user.get("full_name"),
        "evidence_id": evidence_id
    })
    await mongo_storage.update_case(case_id, case)
    
    # Notify investigator
    from app.services.notification_service import notification_service
    if case.get("investigator_email"):
        await notification_service.send_email(
            case.get("investigator_email"),
            f"New Evidence Submitted - {case.get('case_number')}",
            f"""
            <h2>📋 New Evidence Submitted</h2>
            <p><strong>Case:</strong> {case.get('case_number')}</p>
            <p><strong>Evidence Title:</strong> {document.get('title')}</p>
            <p><strong>Submitted By:</strong> {current_user.get('full_name')}</p>
            <p><strong>Status:</strong> PENDING REVIEW</p>
            <p>Please review this evidence in the investigator dashboard.</p>
            """
        )
    
    return {
        "success": True,
        "evidence_id": evidence_id,
        "message": f"Document '{document.get('title')}' submitted as evidence",
        "status": "PENDING_REVIEW"
    }


@router.get("/case-documents/{case_id}")
async def get_case_documents(
    case_id: str,
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.COURT))
):
    """Get documents submitted by user for a case (Investigator view)"""
    case = await mongo_storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Verify access
    if current_user.get("role") == UserRole.INVESTIGATOR.value:
        if case.get("investigator_email") != current_user["email"]:
            raise HTTPException(status_code=403, detail="Not your case")
    
    # Get all evidence that came from user documents
    evidence_list = []
    for ev_id in case.get("evidence", []):
        ev = await mongo_storage.get_evidence(ev_id)
        if ev and ev.get("source") == "USER_DOCUMENT":
            evidence_list.append(ev)
    
    return evidence_list


@router.post("/review-document-evidence/{evidence_id}")
async def review_document_evidence(
    evidence_id: str,
    action: str,  # "ACCEPT" or "REJECT"
    review_notes: str = "",
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    """Investigator reviews user-submitted document evidence"""
    evidence = await mongo_storage.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    if evidence.get("source") != "USER_DOCUMENT":
        raise HTTPException(status_code=400, detail="Not a user-submitted document")
    
    case = await mongo_storage.get_case(evidence.get("case_id"))
    if not case or case.get("investigator_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your case")
    
    now = datetime.now(timezone.utc).isoformat()
    
    if action == "ACCEPT":
        evidence["status"] = "COLLECTED"
        evidence["reviewed_at"] = now
        evidence["reviewed_by"] = current_user["email"]
        evidence["reviewed_by_name"] = current_user.get("full_name")
        evidence["review_notes"] = review_notes
        evidence["review_action"] = "ACCEPTED"
        
        # Add to timeline
        if "timeline" not in case:
            case["timeline"] = []
        case["timeline"].append({
            "action": f"Document evidence '{evidence.get('title')}' ACCEPTED by investigator",
            "timestamp": now,
            "by": current_user["email"],
            "by_name": current_user.get("full_name"),
            "evidence_id": evidence_id
        })
        
        message = "Document evidence accepted and added to case"
        
    elif action == "REJECT":
        evidence["status"] = "REJECTED"
        evidence["reviewed_at"] = now
        evidence["reviewed_by"] = current_user["email"]
        evidence["reviewed_by_name"] = current_user.get("full_name")
        evidence["review_notes"] = review_notes
        evidence["review_action"] = "REJECTED"
        
        case["timeline"].append({
            "action": f"Document evidence '{evidence.get('title')}' REJECTED by investigator",
            "timestamp": now,
            "by": current_user["email"],
            "by_name": current_user.get("full_name"),
            "reason": review_notes
        })
        
        message = "Document evidence rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use ACCEPT or REJECT")
    
    await mongo_storage.save_evidence(evidence_id, evidence)
    await mongo_storage.update_case(evidence.get("case_id"), case)
    
    # Notify user
    fir = await mongo_storage.get_fir(case.get("fir_id"))
    if fir:
        from app.services.notification_service import notification_service
        await notification_service.send_email(
            fir.get("complainant_email"),
            f"Document Review Update - {case.get('case_number')}",
            f"""
            <h2>📋 Document Review Update</h2>
            <p><strong>Case:</strong> {case.get('case_number')}</p>
            <p><strong>Document:</strong> {evidence.get('title')}</p>
            <p><strong>Status:</strong> {action}</p>
            <p><strong>Investigator Notes:</strong> {review_notes or 'No additional notes'}</p>
            <p>Login to your dashboard for more details.</p>
            """
        )
    
    return {
        "success": True,
        "message": message,
        "evidence_id": evidence_id,
        "status": evidence["status"]
    }