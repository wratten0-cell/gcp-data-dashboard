import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes")
    
    # GCP Config
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "tribal-datum-507019-m0")
    GCP_REGION: str = os.getenv("GCP_REGION", "us-central1")
    BQ_DATASET_ID: str = os.getenv("BQ_DATASET_ID", "uploadeddataset")
    
    # Gemini Config
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    
    # BigQuery Data Agent (Conversational Analytics API)
    DATA_AGENT_ID: str = os.getenv("DATA_AGENT_ID", "agent_c4a8c97f-d9a1-47ea-a65d-bfe6f2797718")
    DATA_AGENT_PATH: str = os.getenv(
        "DATA_AGENT_PATH",
        "projects/tribal-datum-507019-m0/locations/us/dataAgents/agent_c4a8c97f-d9a1-47ea-a65d-bfe6f2797718"
    )
    
    # Auth credentials
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", None)

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
