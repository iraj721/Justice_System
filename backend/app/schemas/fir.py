from datetime import datetime

from pydantic import BaseModel, Field


class FIRCreateRequest(BaseModel):
    incident_title: str = Field(min_length=5, max_length=200)
    incident_description: str = Field(min_length=20, max_length=5000)
    incident_location: str = Field(min_length=3, max_length=300)
    incident_datetime: datetime
    complainant_contact: str = Field(min_length=7, max_length=30)
    accused_details: str | None = Field(default=None, max_length=2000)
    witness_details: str | None = Field(default=None, max_length=2000)


class FIRRecord(BaseModel):
    fir_id: str
    complainant_email: str
    status: str
    created_at: datetime
    incident_title: str
    incident_description: str
    incident_location: str
    incident_datetime: datetime
    complainant_contact: str
    accused_details: str | None = None
    witness_details: str | None = None
