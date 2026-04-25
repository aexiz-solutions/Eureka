import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LayoutCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class LayoutRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    created_at: datetime