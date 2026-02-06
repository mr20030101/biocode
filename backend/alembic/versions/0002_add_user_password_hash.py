"""Add password_hash column to users.

Revision ID: 0002_add_user_password_hash
Revises: 0001_initial_schema
Create Date: 2026-02-06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_add_user_password_hash"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(length=255), nullable=False, server_default=""),
    )
    # Optional: drop server_default afterwards so new rows must set it explicitly.
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("password_hash", server_default=None)


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("password_hash")

