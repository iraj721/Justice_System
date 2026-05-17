import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api import auth, fir, cases, forensic, court, admin, user_profile
from app.api import fir_draft, subscriptions, documents, feedback, emergency, case_sharing, help
from app.api import websocket
from app.api import investigator_tasks, investigator_stats, investigator_comm, investigator_search, investigator_court
from app.api import forensic_analysis, forensic_chain, forensic_templates, forensic_dashboard
from app.api import case_timeline, hearing_events
from app.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="Justice System API",
    description="Centralized justice management system",
    version="3.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_cors = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
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

# Include routers
app.include_router(auth.router)
app.include_router(fir.router)
app.include_router(cases.router)
app.include_router(forensic.router)
app.include_router(court.router)
app.include_router(admin.router)
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
app.include_router(case_timeline.router)
app.include_router(hearing_events.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Justice System is running"}

@app.get("/")
async def root():
    return {"message": "Justice System API"}

@app.options("/{path:path}")
async def options_handler():
    return {}