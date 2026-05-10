# backend/app/api/payments.py
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone  # ADD THIS IMPORT

from app.core.authz import get_current_user, require_roles
from app.core.roles import UserRole
from app.services.payment_service import payment_service
from app.services.ipfs_storage import ipfs_storage
from app.services.sms_service import sms_service

router = APIRouter(prefix="/payments", tags=["Payments"])

class PaymentRequest(BaseModel):
    case_id: str
    amount: float
    payment_method: str  # stripe, easypaisa
    mobile_number: Optional[str] = None

@router.post("/create")
async def create_payment(
    payload: PaymentRequest,
    current_user: dict = Depends(require_roles(UserRole.PUBLIC_USER, UserRole.COURT))
):
    """Create a payment for fine or court fee"""
    case = ipfs_storage.get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    result = await payment_service.process_fine_payment(
        case_id=payload.case_id,
        amount=payload.amount,
        payment_method=payload.payment_method,
        payer_info={"mobile_number": payload.mobile_number, "email": current_user["email"]}
    )
    
    return result

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Stripe webhook for payment confirmation"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    # Verify and process webhook
    # This would verify the signature and update payment status
    
    return {"status": "received"}

@router.get("/verify/{payment_id}")
async def verify_payment(
    payment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Verify payment status"""
    # Find case with this payment
    all_cases = ipfs_storage.get_all_cases()
    for case in all_cases:
        for payment in case.get("fine_payments", []):
            if payment.get("payment_id") == payment_id:
                return {
                    "payment_id": payment_id,
                    "case_id": case.get("case_id"),
                    "amount": payment.get("amount"),
                    "status": payment.get("status")
                }
    
    raise HTTPException(status_code=404, detail="Payment not found")