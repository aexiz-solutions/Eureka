"""create layouts table

Revision ID: 20260425_0004
Revises: 20260425_0003
Create Date: 2026-04-25 00:00:03
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260425_0004"
down_revision = "20260425_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "layouts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_layouts_user_id"), "layouts", ["user_id"], unique=False)
    op.create_index(op.f("ix_layouts_created_at"), "layouts", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_layouts_created_at"), table_name="layouts")
    op.drop_index(op.f("ix_layouts_user_id"), table_name="layouts")
    op.drop_table("layouts")