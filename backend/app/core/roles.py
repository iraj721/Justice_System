from enum import Enum

class UserRole(str, Enum):
    PUBLIC_USER = "PUBLIC_USER"          
    INVESTIGATOR = "INVESTIGATOR"     
    FORENSIC_ANALYST = "FORENSIC_ANALYST"
    COURT = "COURT"
    ADMIN = "ADMIN"   

# Onboarding codes for restricted roles (in production, these would be issued by authority)
ONBOARDING_CODES = {
    UserRole.INVESTIGATOR: "POLICE-2026",
    UserRole.FORENSIC_ANALYST: "LAB-2026", 
    UserRole.COURT: "JUDGE-2026",
    UserRole.ADMIN: "ADMIN-2026",
}

RESTRICTED_ROLES = {UserRole.INVESTIGATOR, UserRole.FORENSIC_ANALYST, UserRole.COURT, UserRole.ADMIN}