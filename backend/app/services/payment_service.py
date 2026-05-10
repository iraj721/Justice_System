# backend/app/services/payment_service.py
import logging
import json
import hmac
import hashlib
import secrets
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import requests

from app.core.config import settings
from app.services.ipfs_storage import ipfs_storage

logger = logging.getLogger(__name__)

# Try to import Stripe
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    stripe = None
    logger.warning("Stripe not installed")

class PaymentService:
    def __init__(self):
        self.stripe_enabled = STRIPE_AVAILABLE and settings.STRIPE_SECRET_KEY
        if self.stripe_enabled:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            logger.info("Stripe payment service enabled")
        
        self.easypaisa_enabled = bool(settings.EASYPAISA_CLIENT_ID)
        if self.easypaisa_enabled:
            logger.info("EasyPaisa payment service enabled")
    
    # ============ Stripe Integration ============
    
    async def create_stripe_payment_intent(self, amount: float, currency: str = "pkr", 
                                            case_id: str = None, description: str = None) -> Dict[str, Any]:
        """Create Stripe payment intent"""
        if not self.stripe_enabled:
            return {"error": "Stripe not configured", "success": False}
        
        try:
            # Convert PKR to cents (if PKR, Stripe uses smallest unit)
            # For PKR, amount is in rupees, not paisa
            amount_cents = int(amount * 100) if currency == "usd" else int(amount)
            
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency.lower(),
                metadata={
                    "case_id": case_id or "",
                    "description": description or "Justice System Payment"
                },
                description=description or "Court Fine / Fee Payment"
            )
            
            # Store payment record locally
            if case_id:
                payment_record = {
                    "payment_id": intent.id,
                    "case_id": case_id,
                    "amount": amount,
                    "currency": currency,
                    "status": intent.status,
                    "created_at": datetime.now().isoformat(),
                    "client_secret": intent.client_secret
                }
                
                payments = self._get_case_payments(case_id)
                payments[intent.id] = payment_record
                self._save_case_payments(case_id, payments)
            
            return {
                "success": True,
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
                "amount": amount,
                "currency": currency
            }
        except Exception as e:
            logger.error(f"Stripe payment intent failed: {e}")
            return {"error": str(e), "success": False}
    
    async def confirm_stripe_payment(self, payment_intent_id: str) -> Dict[str, Any]:
        """Confirm Stripe payment status"""
        if not self.stripe_enabled:
            return {"error": "Stripe not configured"}
        
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                "success": True,
                "status": intent.status,
                "amount": intent.amount / 100 if intent.currency == "usd" else intent.amount,
                "currency": intent.currency
            }
        except Exception as e:
            return {"error": str(e)}
    
    # ============ EasyPaisa Integration (Pakistan) ============
    
    async def create_easypaisa_payment(self, amount: float, mobile_number: str, 
                                         case_id: str, description: str) -> Dict[str, Any]:
        """Create EasyPaisa payment request"""
        if not self.easypaisa_enabled:
            return {"error": "EasyPaisa not configured", "success": False}
        
        try:
            # This is a template - actual API will vary
            # EasyPaisa API endpoint (production)
            api_url = "https://api.easypaisa.com/v1/payments"
            
            order_id = f"JUSTICE_{case_id}_{int(datetime.now().timestamp())}"
            
            payload = {
                "amount": amount,
                "mobileNumber": mobile_number,
                "orderId": order_id,
                "description": description,
                "clientId": settings.EASYPAISA_CLIENT_ID,
                "callbackUrl": f"{settings.BASE_URL}/api/payments/easypaisa-callback"
            }
            
            # Store pending payment
            pending_payment = {
                "order_id": order_id,
                "case_id": case_id,
                "amount": amount,
                "mobile_number": mobile_number,
                "status": "PENDING",
                "created_at": datetime.now().isoformat()
            }
            
            payments = self._get_case_payments(case_id)
            payments[order_id] = pending_payment
            self._save_case_payments(case_id, payments)
            
            return {
                "success": True,
                "order_id": order_id,
                "amount": amount,
                "payment_url": f"https://easypaisa.com/pay/{order_id}",  # Placeholder
                "instructions": "Open EasyPaisa app and complete payment"
            }
        except Exception as e:
            logger.error(f"EasyPaisa payment failed: {e}")
            return {"error": str(e), "success": False}
    
    async def verify_easypaisa_payment(self, order_id: str) -> Dict[str, Any]:
        """Verify EasyPaisa payment status"""
        # Find case from order_id
        # This would call EasyPaisa API to check status
        return {"status": "PENDING", "success": True}
    
    # ============ Fine Payment for Cases ============
    
    async def process_fine_payment(self, case_id: str, amount: float, 
                                    payment_method: str, payer_info: Dict) -> Dict[str, Any]:
        """Process fine payment for a case"""
        case = ipfs_storage.get_case(case_id)
        if not case:
            return {"error": "Case not found", "success": False}
        
        if payment_method == "stripe":
            result = await self.create_stripe_payment_intent(amount, "pkr", case_id, f"Fine for case {case_id}")
        elif payment_method == "easypaisa":
            mobile = payer_info.get("mobile_number")
            if not mobile:
                return {"error": "Mobile number required for EasyPaisa"}
            result = await self.create_easypaisa_payment(amount, mobile, case_id, f"Fine for case {case_id}")
        else:
            return {"error": f"Unknown payment method: {payment_method}"}
        
        # Update case with fine payment info
        if result.get("success"):
            if "fine_payments" not in case:
                case["fine_payments"] = []
            
            case["fine_payments"].append({
                "amount": amount,
                "method": payment_method,
                "payment_id": result.get("payment_intent_id") or result.get("order_id"),
                "status": "INITIATED",
                "created_at": datetime.now().isoformat()
            })
            ipfs_storage.update_case(case_id, case)
        
        return result
    
    # ============ Helper Methods ============
    
    def _get_case_payments(self, case_id: str) -> Dict:
        """Get payments for a case"""
        payments_file = f"data/payments_{case_id}.json"
        try:
            with open(payments_file, 'r') as f:
                return json.load(f)
        except:
            return {}
    
    def _save_case_payments(self, case_id: str, payments: Dict):
        """Save payments for a case"""
        payments_file = f"data/payments_{case_id}.json"
        with open(payments_file, 'w') as f:
            json.dump(payments, f, indent=2)

payment_service = PaymentService()