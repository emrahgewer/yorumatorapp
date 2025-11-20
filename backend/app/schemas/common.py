from datetime import datetime
from typing import Any

from pydantic import BaseModel


class Timestamped(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime | None = None


class Message(BaseModel):
    message: str
    detail: Any | None = None
