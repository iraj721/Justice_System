# backend/app/api/forensic_templates.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, List, Dict
import uuid
import json
from app.core.authz import require_roles
from app.core.roles import UserRole
from app.services.ipfs_storage import ipfs_storage
from app.core.ipfs_client import ipfs_client

router = APIRouter(prefix="/forensic/templates", tags=["Forensic Templates"])

class TemplateCreate(BaseModel):
    name: str
    description: str
    analysis_type: str
    sections: List[Dict[str, str]]
    is_public: bool = True

# Predefined templates
PREDEFINED_TEMPLATES = {
    "DIGITAL_FORENSICS": {
        "name": "Digital Forensics Analysis Report",
        "description": "Standard template for digital evidence analysis",
        "sections": [
            {"title": "Case Information", "fields": ["Case Number", "Evidence ID", "Examiner Name", "Examination Date"]},
            {"title": "Device Information", "fields": ["Device Type", "Make/Model", "Serial Number", "Storage Capacity"]},
            {"title": "Acquisition Details", "fields": ["Acquisition Method", "Tool Used", "Hash Value", "Date Acquired"]},
            {"title": "Findings", "fields": ["Recovered Files", "Deleted Files", "Internet History", "Timeline"]},
            {"title": "Conclusion", "fields": ["Summary", "Recommendations"]}
        ]
    },
    "DNA_ANALYSIS": {
        "name": "DNA Analysis Report",
        "description": "Standard template for DNA evidence analysis",
        "sections": [
            {"title": "Case Information", "fields": ["Case Number", "Evidence ID", "Examiner Name", "Examination Date"]},
            {"title": "Sample Information", "fields": ["Sample Type", "Sample Condition", "Quantity", "Storage Conditions"]},
            {"title": "Testing Methodology", "fields": ["Extraction Method", "Amplification Kit", "Analysis Instrument", "Controls Used"]},
            {"title": "Results", "fields": ["DNA Profile", "Peak Heights", "Allele Calls", "Mixed Profile Analysis"]},
            {"title": "Interpretation", "fields": ["Statistical Analysis", "Random Match Probability", "Conclusion"]}
        ]
    },
    "FINGERPRINT": {
        "name": "Fingerprint Analysis Report",
        "description": "Standard template for fingerprint evidence",
        "sections": [
            {"title": "Case Information", "fields": ["Case Number", "Evidence ID", "Examiner Name", "Examination Date"]},
            {"title": "Latent Print", "fields": ["Location Found", "Substrate", "Development Method", "Quality"]},
            {"title": "Comparison", "fields": ["Known Prints Used", "Comparison Method", "Minutiae Points", "Level of Detail"]},
            {"title": "Conclusion", "fields": ["Identification", "Individualization", "Inconclusive"]}
        ]
    },
    "BALLISTICS": {
        "name": "Ballistics Analysis Report",
        "description": "Standard template for ballistic evidence",
        "sections": [
            {"title": "Case Information", "fields": ["Case Number", "Evidence ID", "Examiner Name", "Examination Date"]},
            {"title": "Firearm Information", "fields": ["Type", "Make/Model", "Caliber", "Serial Number"]},
            {"title": "Ammunition", "fields": ["Type", "Brand", "Caliber", "Condition"]},
            {"title": "Examination Results", "fields": ["Barrel Marks", "Firing Pin Impression", "Breech Face Marks", "Comparison Results"]},
            {"title": "Conclusion", "fields": ["Match/No Match", "Inconclusive"]}
        ]
    }
}

@router.get("/predefined")
async def get_predefined_templates(current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Get predefined analysis templates"""
    return PREDEFINED_TEMPLATES

@router.get("/my-templates")
async def get_my_templates(current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Get user's custom templates"""
    templates = ipfs_storage.get_user_templates(current_user["email"])
    return list(templates.values())

@router.post("/create")
async def create_template(payload: TemplateCreate, current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))):
    """Create custom analysis template"""
    template_id = f"TMPL-{uuid.uuid4().hex[:8].upper()}"
    
    template = {
        "template_id": template_id,
        "name": payload.name,
        "description": payload.description,
        "analysis_type": payload.analysis_type,
        "sections": payload.sections,
        "is_public": payload.is_public,
        "created_by": current_user["email"],
        "created_by_name": current_user.get("full_name"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    templates = ipfs_storage.get_user_templates(current_user["email"])
    templates[template_id] = template
    ipfs_storage.save_user_templates(current_user["email"], templates)
    
    return template

@router.get("/generate-report/{analysis_id}")
async def generate_report_from_template(
    analysis_id: str,
    template_id: str,
    current_user: dict = Depends(require_roles(UserRole.FORENSIC_ANALYST))
):
    """Generate formatted report using template"""
    # Find analysis
    all_evidence = ipfs_storage.get_all_evidence()
    found_analysis = None
    found_evidence = None
    
    for evidence in all_evidence:
        analyses = ipfs_storage.get_evidence_analyses(evidence.get("evidence_id"))
        if analysis_id in analyses:
            found_analysis = analyses[analysis_id]
            found_evidence = evidence
            break
    
    if not found_analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Get template
    templates = ipfs_storage.get_user_templates(current_user["email"])
    template = templates.get(template_id)
    
    if not template:
        # Check predefined templates
        template = PREDEFINED_TEMPLATES.get(template_id.upper())
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Generate formatted report
    case = ipfs_storage.get_case(found_evidence.get("case_id"))
    fir = ipfs_storage.get_fir(case.get("fir_id")) if case else None
    
    report = {
        "report_id": f"FR-{uuid.uuid4().hex[:8].upper()}",
        "template_used": template.get("name"),
        "analysis": found_analysis,
        "case_info": {
            "case_number": case.get("case_number") if case else "N/A",
            "case_title": case.get("title") if case else "N/A",
            "fir_number": fir.get("fir_number") if fir else "N/A",
            "complainant": fir.get("complainant_name") if fir else "N/A"
        },
        "evidence_info": {
            "evidence_id": found_evidence.get("evidence_id"),
            "title": found_evidence.get("title"),
            "description": found_evidence.get("description"),
            "ipfs_cid": found_evidence.get("ipfs_cid"),
            "hash": found_evidence.get("hash")
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": current_user["email"],
        "generated_by_name": current_user.get("full_name")
    }
    
    # Save report
    reports = ipfs_storage.get_forensic_reports()
    reports[report["report_id"]] = report
    ipfs_storage.save_forensic_reports(reports)
    
    return report