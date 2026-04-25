"""add subscription tier to users

Revision ID: 20260425_0002
Revises: 20260425_0001
Create Date: 2026-04-25 00:00:01
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260425_0002"
down_revision = "20260425_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "subscription_tier",
            sa.String(length=32),
            nullable=False,
            server_default="individual-plus",
        ),
    )
    op.create_index(op.f("ix_users_subscription_tier"), "users", ["subscription_tier"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_subscription_tier"), table_name="users")
    op.drop_column("users", "subscription_tier")