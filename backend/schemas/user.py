import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from core.constants import ROLE_TYPE, TIER_TYPE


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    role: ROLE_TYPE
    subscription_tier: TIER_TYPE
    created_at: datetime
