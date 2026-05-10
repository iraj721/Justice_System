from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import uuid
from app.core.authz import get_current_user, require_roles
from app.core.roles import UserRole
from app.services.ipfs_storage import ipfs_storage
from app.services.notification_service import notification_service
from app.api.websocket import notify_case_update

router = APIRouter(prefix="/feedback", tags=["Feedback"])

class FeedbackRequest(BaseModel):
    category: str  # COMPLAINT, SUGGESTION, APPRECIATION, BUG
    subject: str
    message: str
    rating: Optional[int] = None
    case_id: Optional[str] = None  # NEW: Link to specific case

class FeedbackUpdate(BaseModel):
    status: str
    response: Optional[str] = None

@router.post("/submit")
async def submit_feedback(
    payload: FeedbackRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit feedback - linked to case if provided"""
    
    feedback_id = f"FB-{uuid.uuid4().hex[:8].upper()}"
    
    # Get case if case_id provided
    case = None
    investigator_email = None
    if payload.case_id:
        case = ipfs_storage.get_case(payload.case_id)
        if case:
            investigator_email = case.get("investigator_email")
    
    feedback_data = {
        "feedback_id": feedback_id,
        "user_email": current_user["email"],
        "user_name": current_user.get("full_name", current_user["email"]),
        "category": payload.category,
        "subject": payload.subject,
        "message": payload.message,
        "rating": payload.rating,
        "case_id": payload.case_id,
        "case_number": case.get("case_number") if case else None,
        "status": "PENDING",
        "response": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    ipfs_storage.save_feedback(feedback_id, feedback_data)
    
    # ============ 1. ADD TIMELINE EVENT TO CASE ============
    if case and payload.case_id:
        category_icons = {
            "COMPLAINT": "⚠️",
            "SUGGESTION": "💡",
            "APPRECIATION": "👍",
            "BUG": "🐛"
        }
        
        if "timeline" not in case:
            case["timeline"] = []
        
        case["timeline"].append({
            "action": f"{category_icons.get(payload.category, '📝')} Feedback: {payload.subject}",
            "description": payload.message[:200],
            "type": "feedback",
            "category": payload.category,
            "feedback_id": feedback_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "by": current_user["email"],
            "by_name": current_user.get("full_name", current_user["email"])
        })
        
        case["updated_at"] = datetime.now(timezone.utc).isoformat()
        ipfs_storage.update_case(payload.case_id, case)
        
        # WebSocket notification for real-time update
        await notify_case_update(payload.case_id, "feedback_added", {
            "feedback_id": feedback_id,
            "subject": payload.subject,
            "category": payload.category
        })
    
    # ============ 2. SEND TO INVESTIGATOR ============
    if investigator_email:
        # Category-specific message
        category_messages = {
            "COMPLAINT": "⚠️ A complaint has been filed regarding this case.",
            "SUGGESTION": "💡 A suggestion has been submitted for this case.",
            "APPRECIATION": "👍 Positive feedback received for this case.",
            "BUG": "🐛 A technical issue has been reported."
        }
        
        email_body = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; background: #0b0e1a;">
            <div style="max-width: 550px; margin: 0 auto; background: #0c0f1a; border: 1px solid #6366f1; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 20px; text-align: center;">
                    <div style="font-size: 40px;">📝</div>
                    <h2 style="color: white;">New Feedback Received</h2>
                </div>
                <div style="padding: 25px;">
                    <p><strong>Case:</strong> {case.get('case_number') if case else 'N/A'}</p>
                    <p><strong>From:</strong> {current_user.get('full_name', current_user['email'])}</p>
                    <p><strong>Category:</strong> {payload.category}</p>
                    <p><strong>Subject:</strong> {payload.subject}</p>
                    <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="color: #7a849c;">{payload.message}</p>
                    </div>
                    <p>{category_messages.get(payload.category, "Please review and respond.")}</p>
                    <p><a href="http://localhost:5173/app" style="color: #818cf8;">View in Dashboard →</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        await notification_service.send_email(
            to_email=investigator_email,
            subject=f"📝 New {payload.category}: {payload.subject} - Case {case.get('case_number', '')}",
            body=email_body
        )
    
    # ============ 3. SEND CONFIRMATION TO USER ============
    confirmation_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; background: #0b0e1a;">
        <div style="max-width: 500px; margin: 0 auto; background: #0c0f1a; border: 1px solid #10b981; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
                <div style="font-size: 40px;">✅</div>
                <h2 style="color: white;">Feedback Received</h2>
            </div>
            <div style="padding: 25px;">
                <p>Dear <strong>{current_user.get('full_name', current_user['email'])}</strong>,</p>
                <p>Thank you for your feedback. It has been added to the case timeline and the investigator has been notified.</p>
                {"<p>Your feedback will help improve the investigation process.</p>" if payload.case_id else "<p>Your feedback has been recorded.</p>"}
                <p style="color: #10b981;">Reference ID: {feedback_id}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    await notification_service.send_email(
        to_email=current_user["email"],
        subject="✅ Feedback Received - Justice System",
        body=confirmation_body
    )
    
    return {
        "message": "Feedback submitted successfully", 
        "feedback_id": feedback_id,
        "added_to_timeline": bool(payload.case_id),
        "notified_investigator": bool(investigator_email)
    }


@router.get("/case/{case_id}")
async def get_case_feedback(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all feedback for a specific case"""
    all_feedback = ipfs_storage.get_all_feedback()
    case_feedback = [f for f in all_feedback if f.get("case_id") == case_id]
    return sorted(case_feedback, key=lambda x: x.get("created_at", ""), reverse=True)


@router.get("/my-feedback")
async def get_my_feedback(current_user: dict = Depends(get_current_user)):
    """Get feedback submitted by current user"""
    all_feedback = ipfs_storage.get_all_feedback()
    my_feedback = [f for f in all_feedback if f.get("user_email") == current_user["email"]]
    return sorted(my_feedback, key=lambda x: x.get("created_at", ""), reverse=True)


@router.get("/categories")
async def get_feedback_categories():
    """Get available feedback categories"""
    return {
        "categories": [
            {"value": "COMPLAINT", "label": "Complaint", "icon": "⚠️", "color": "#ef4444"},
            {"value": "SUGGESTION", "label": "Suggestion", "icon": "💡", "color": "#f59e0b"},
            {"value": "APPRECIATION", "label": "Appreciation", "icon": "👍", "color": "#10b981"},
            {"value": "BUG", "label": "Bug Report", "icon": "🐛", "color": "#8b5cf6"}
        ]
    }


@router.get("/all")
async def get_all_feedback(
    current_user: dict = Depends(require_roles(UserRole.INVESTIGATOR))
):
    """Get all feedback for investigator's cases"""
    all_feedback = ipfs_storage.get_all_feedback()
    
    # If investigator, only show feedback for their cases
    investigator_email = current_user["email"]
    all_cases = ipfs_storage.get_all_cases()
    investigator_case_ids = [c.get("case_id") for c in all_cases if c.get("investigator_email") == investigator_email]
    
    filtered_feedback = [f for f in all_feedback if f.get("case_id") in investigator_case_ids]
    
    return sorted(filtered_feedback, key=lambda x: x.get("created_at", ""), reverse=True)