from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    project_name: str = "Yorumator API"
    api_v1_str: str = "/api/v1"
    environment: str = "local"

    secret_key: str
    access_token_expire_minutes: int = 15
    refresh_token_expire_minutes: int = 60 * 24 * 30

    postgres_server: str
    postgres_port: int = 5432
    postgres_db: str
    postgres_user: str
    postgres_password: str

    redis_url: str = "redis://localhost:6379/0"

    s3_endpoint: str | None = None
    s3_bucket: str | None = None
    s3_access_key: str | None = None
    s3_secret_key: str | None = None

    allowed_origins: List[str] = ["http://localhost:3000", "*"]  # Mobil uygulama için tüm origin'lere izin ver

    two_factor_issuer: str = "Yorumator"


@lru_cache
def get_settings() -> Settings:
    return Settings()
