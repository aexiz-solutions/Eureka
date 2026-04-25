from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import DEFAULT_PLAN_LIMITS, VALID_TIERS
from models.plan_limit import PlanLimit


async def ensure_default_plan_limits(db: AsyncSession) -> None:
    result = await db.execute(select(PlanLimit))
    if result.scalars().first() is not None:
        return

    db.add_all(
        [
            PlanLimit(
                tier=tier,
                annual_planogram_limit=DEFAULT_PLAN_LIMITS[tier],
                is_unlimited=DEFAULT_PLAN_LIMITS[tier] is None,
            )
            for tier in VALID_TIERS
        ],
    )
    await db.commit()