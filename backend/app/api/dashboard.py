# backend/app/api/dashboard.py
from fastapi import APIRouter, Depends

from app.core.authz import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/me")
def my_dashboard_context(current_user: dict = Depends(get_current_user)) -> dict:
    return {
        "route": "/app",
        "email": current_user["email"],
        "role": current_user["role"],
        "message": "Use one dashboard route and render role-specific tabs/widgets.",
    }