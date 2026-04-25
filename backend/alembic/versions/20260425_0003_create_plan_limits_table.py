"""create plan limits table

Revision ID: 20260425_0003
Revises: 20260425_0002
Create Date: 2026-04-25 00:00:02
"""

from alembic import op
import sqlalchemy as sa
import uuid


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
        sa.column("id", sa.Uuid()),
        sa.column("tier", sa.String()),
        sa.column("annual_planogram_limit", sa.Integer()),
        sa.column("is_unlimited", sa.Boolean()),
    )

    op.bulk_insert(
        plan_limit_table,
        [
            {
                "id": uuid.uuid4(),
                "tier": "admin",
                "annual_planogram_limit": None,
                "is_unlimited": True,
            },
            {
                "id": uuid.uuid4(),
                "tier": "individual-plus",
                "annual_planogram_limit": 15,
                "is_unlimited": False,
            },
            {
                "id": uuid.uuid4(),
                "tier": "individual-pro",
                "annual_planogram_limit": 45,
                "is_unlimited": False,
            },
            {
                "id": uuid.uuid4(),
                "tier": "enterprise",
                "annual_planogram_limit": None,
                "is_unlimited": True,
            },
        ],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_plan_limits_tier"), table_name="plan_limits")
    op.drop_table("plan_limits")