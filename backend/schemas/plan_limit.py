from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from core.constants import TIER_TYPE


class PlanLimitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tier: TIER_TYPE
    annual_planogram_limit: int | None
    is_unlimited: bool
    created_at: datetime
    updated_at: datetime


class PlanLimitUpdate(BaseModel):
    annual_planogram_limit: int | None = Field(default=None, ge=1)
    is_unlimited: bool | None = None