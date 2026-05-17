# backend/app/api/help.py
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from app.core.authz import get_current_user

router = APIRouter(prefix="/help", tags=["Help Center"])

@router.get("/faq")
async def get_faqs(category: Optional[str] = None):
    """Get frequently asked questions"""
    faqs = {
        "general": [
            {
                "id": 1,
                "question": "How to file an FIR?",
                "answer": "Login to your account, go to Dashboard, click 'File New FIR', fill in all required details, review and submit."
            },
            {
                "id": 2,
                "question": "How to track case status?",
                "answer": "Go to 'My FIRs' section, click on any FIR to view detailed status and timeline."
            },
            {
                "id": 3,
                "question": "What documents do I need?",
                "answer": "For FIR filing, you need CNIC copy, incident details, witness information if available."
            }
        ],
        "evidence": [
            {
                "id": 4,
                "question": "What evidence can I upload?",
                "answer": "You can upload documents (PDF, DOCX), images (JPG, PNG), videos (MP4), and audio files (MP3). Max 50MB per file."
            },
            {
                "id": 5,
                "question": "Is my evidence secure?",
                "answer": "Yes, all evidence is stored on Cloudinary with cryptographic hash verification. Evidence cannot be tampered."
            },
            {
                "id": 6,
                "question": "How to verify evidence?",
                "answer": "Each evidence has a unique hash. You can verify by uploading the original file and comparing hashes."
            }
        ],
        "court": [
            {
                "id": 7,
                "question": "Can I attend hearing online?",
                "answer": "Yes, virtual hearings are available. You'll receive a meeting link via email/SMS before the hearing."
            },
            {
                "id": 8,
                "question": "How to check judgment?",
                "answer": "Once judgment is delivered, you can view it in the 'Case Details' section."
            }
        ],
        "profile": [
            {
                "id": 9,
                "question": "How to update profile?",
                "answer": "Go to 'My Profile' tab, click 'Edit Profile', update information and save."
            },
            {
                "id": 10,
                "question": "Can I change my email?",
                "answer": "Email cannot be changed as it's your unique identifier. For email change, please contact support."
            }
        ]
    }
    
    if category and category in faqs:
        return {"category": category, "faqs": faqs[category]}
    
    return {"categories": list(faqs.keys()), "faqs": faqs}

@router.get("/guides")
async def get_user_guides():
    """Get user guides for the system"""
    return {
        "guides": [
            {
                "id": "getting_started",
                "title": "Getting Started Guide",
                "icon": "🚀",
                "steps": [
                    "Register with your email and complete profile",
                    "Verify your email address",
                    "Add emergency contacts (optional)",
                    "File your first FIR",
                    "Track case status from dashboard"
                ]
            },
            {
                "id": "filing_fir",
                "title": "How to File an FIR",
                "icon": "📝",
                "steps": [
                    "Login to your account",
                    "Click 'File New FIR' button",
                    "Fill complainant details (name, contact, address)",
                    "Describe incident (title, description, location, time)",
                    "Add suspect information if known",
                    "Add witness information if available",
                    "Review all details and submit",
                    "Save FIR number for future tracking"
                ]
            },
            {
                "id": "evidence_upload",
                "title": "Evidence Upload Guide",
                "icon": "📎",
                "steps": [
                    "Go to your case details",
                    "Click 'Upload Evidence'",
                    "Enter evidence title and description",
                    "Select file to upload (max 50MB)",
                    "Wait for upload (hash generated automatically)",
                    "Save the evidence ID and hash for verification",
                    "Evidence is now tamper-proof on Cloudinary"
                ]
            },
            {
                "id": "case_tracking",
                "title": "Case Tracking Guide",
                "icon": "🔍",
                "steps": [
                    "Go to 'My FIRs' section",
                    "Select the FIR/case you want to track",
                    "View timeline showing all events",
                    "Check progress percentage",
                    "See next steps and estimated time",
                    "Subscribe to email/SMS updates"
                ]
            }
        ],
        "video_tutorials": [
            {
                "title": "How to Register",
                "duration": "2:30",
                "link": "/videos/register.mp4"
            },
            {
                "title": "How to File FIR",
                "duration": "5:00",
                "link": "/videos/file-fir.mp4"
            },
            {
                "title": "How to Upload Evidence",
                "duration": "3:15",
                "link": "/videos/upload-evidence.mp4"
            }
        ]
    }

@router.get("/contact")
async def get_support_info():
    """Get support contact information"""
    return {
        "support": {
            "email": "support@justice.gov.pk",
            "helpline": "1234",
            "timings": "9:00 AM - 5:00 PM (Monday to Friday)",
            "emergency": "15 for police emergencies"
        }
    }