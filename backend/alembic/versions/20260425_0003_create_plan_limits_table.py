"""create plan limits table

Revision ID: 20260425_0003
Revises: 20260425_0002
Create Date: 2026-04-25 00:00:02
"""

from alembic import op
import sqlalchemy as sa

from core.constants import (
    DEFAULT_PLAN_LIMITS,
    TIER_ADMIN,
    TIER_ENTERPRISE,
    TIER_INDIVIDUAL_PLUS,
    TIER_INDIVIDUAL_PRO,
)


# revision identifiers, used by Alembic.
revision = "20260425_0003"
down_revision = "20260425_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "plan_limits",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tier", sa.String(length=32), nullable=False),
        sa.Column("annual_planogram_limit", sa.Integer(), nullable=True),
        sa.Column("is_unlimited", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tier"),
    )
    op.create_index(op.f("ix_plan_limits_tier"), "plan_limits", ["tier"], unique=False)

    plan_limit_table = sa.table(
        "plan_limits",
        sa.column("tier", sa.String()),
        sa.column("annual_planogram_limit", sa.Integer()),
        sa.column("is_unlimited", sa.Boolean()),
    )

    op.bulk_insert(
        plan_limit_table,
        [
            {
                "tier": TIER_ADMIN,
                "annual_planogram_limit": DEFAULT_PLAN_LIMITS[TIER_ADMIN],
                "is_unlimited": True,
            },
            {
                "tier": TIER_INDIVIDUAL_PLUS,
                "annual_planogram_limit": DEFAULT_PLAN_LIMITS[TIER_INDIVIDUAL_PLUS],
                "is_unlimited": False,
            },
            {
                "tier": TIER_INDIVIDUAL_PRO,
                "annual_planogram_limit": DEFAULT_PLAN_LIMITS[TIER_INDIVIDUAL_PRO],
                "is_unlimited": False,
            },
            {
                "tier": TIER_ENTERPRISE,
                "annual_planogram_limit": DEFAULT_PLAN_LIMITS[TIER_ENTERPRISE],
                "is_unlimited": True,
            },
        ],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_plan_limits_tier"), table_name="plan_limits")
    op.drop_table("plan_limits")