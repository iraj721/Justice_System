# backend/app/main.py
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api import auth, fir, cases, forensic, court, admin, ipfs, user_profile, anchors, verify
from app.api import fir_draft, subscriptions, documents, feedback, emergency, case_sharing, help
from app.api import websocket  
from app.api import investigator_tasks, investigator_stats, investigator_comm, investigator_search, investigator_court
from app.api import forensic_analysis, forensic_chain, forensic_templates, forensic_dashboard
from app.core.config import settings
from app.api import blockchain_viewer
from app.api import payments, video, notifications
from app.api import case_timeline
from app.api import case_sharing
from app.api import hearing_events


logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="Decentralized Justice System API",
    description="Blockchain-based evidence management system with real-time updates",
    version="3.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
_cors = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
# Add localhost explicitly for development
_cors.append("http://localhost:5173")
_cors.append("http://127.0.0.1:5173")
# Remove duplicates
_cors = list(set(_cors))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors,
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
    expose_headers=["*"],
    max_age=86400,
)

# Include all routers
app.include_router(auth.router)
app.include_router(fir.router)
app.include_router(cases.router)
app.include_router(forensic.router)
app.include_router(court.router)
app.include_router(admin.router)
app.include_router(ipfs.router)
app.include_router(anchors.router)
app.include_router(verify.router)
app.include_router(user_profile.router)
app.include_router(fir_draft.router)
app.include_router(subscriptions.router)
app.include_router(documents.router)
app.include_router(feedback.router)
app.include_router(emergency.router)
app.include_router(case_sharing.router)
app.include_router(help.router)
app.include_router(investigator_tasks.router)
app.include_router(investigator_stats.router)
app.include_router(investigator_comm.router)
app.include_router(investigator_search.router)
app.include_router(investigator_court.router)
app.include_router(forensic_analysis.router)
app.include_router(forensic_chain.router)
app.include_router(forensic_templates.router)
app.include_router(forensic_dashboard.router)
app.include_router(websocket.router)  
app.include_router(blockchain_viewer.router)
app.include_router(payments.router)
app.include_router(video.router)
app.include_router(notifications.router)
app.include_router(case_timeline.router)
app.include_router(hearing_events.router)
app.include_router(blockchain_viewer.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Justice System is running"}

@app.get("/")
async def root():
    return {"message": "Decentralized Justice System API"}

@app.options("/{path:path}")
async def options_handler():
    return {}