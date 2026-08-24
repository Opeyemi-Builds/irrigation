from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    openweather_api_key: str = ""
    farm_lat: float = 7.3775
    farm_lon: float = 3.9470
    frontend_url: str = "http://localhost:5173"

    # Supabase (database). Leave both blank to run on in-memory data only.
    supabase_url: str = ""            # e.g. https://xxxx.supabase.co
    supabase_service_key: str = ""    # service_role key — SECRET, backend only

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
