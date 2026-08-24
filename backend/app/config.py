from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    openweather_api_key: str = ""
    farm_lat: float = 7.3775
    farm_lon: float = 3.9470
    frontend_url: str = "http://localhost:5173"

    # Leave both blank to run without a database (in-memory only).
    supabase_url: str = ""
    supabase_service_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
