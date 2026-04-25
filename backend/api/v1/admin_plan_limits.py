from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.api_response import error_payload, success_response
from core.constants import ROLE_ADMIN, TIER_TYPE
from core.deps import require_role
from db.session import get_db
from models.plan_limit import PlanLimit
from schemas.plan_limit import PlanLimitRead, PlanLimitUpdate
from services.plan_limit_service import ensure_default_plan_limits

router = APIRouter(prefix="/api/v1/admin/plan-limits", tags=["admin-plan-limits"])


@router.get("")
async def list_plan_limits(
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_role([ROLE_ADMIN])),
) -> dict:
    await ensure_default_plan_limits(db)
    result = await db.execute(select(PlanLimit).order_by(PlanLimit.tier))
    records = result.scalars().all()
    response_data = [PlanLimitRead.model_validate(record).model_dump(mode="json") for record in records]
    return success_response(response_data, "Plan limits fetched successfully.")


@router.patch("/{tier}")
async def update_plan_limit(
    tier: TIER_TYPE,
    payload: PlanLimitUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_role([ROLE_ADMIN])),
) -> dict:
    await ensure_default_plan_limits(db)
    result = await db.execute(select(PlanLimit).where(PlanLimit.tier == tier))
    record = result.scalar_one_or_none()
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_payload("plan_limit_not_found", f"No plan limit exists for tier '{tier}'."),
        )

    if payload.is_unlimited is not None:
        record.is_unlimited = payload.is_unlimited
        if payload.is_unlimited:
            record.annual_planogram_limit = None

    if payload.annual_planogram_limit is not None:
        record.annual_planogram_limit = payload.annual_planogram_limit
        record.is_unlimited = False

    await db.commit()
    await db.refresh(record)

    response_data = PlanLimitRead.model_validate(record).model_dump(mode="json")
    return success_response(response_data, "Plan limit updated successfully.")