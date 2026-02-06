"""Normalize ticket service report into ticket_responses.

Revision ID: 0005_normalize_ticket_service_report
Revises: 0004_add_tickets_and_equipment_history
Create Date: 2026-02-06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0005_normalize_ticket_service_report"
down_revision: Union[str, None] = "0004_add_tickets_and_equipment_history"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    if "ticket_responses" in existing_tables:
        return

    op.create_table(
        "ticket_responses",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("ticket_id", sa.String(length=36), nullable=False),
        sa.Column("diagnosis", sa.Text(), nullable=True),
        sa.Column("action_taken", sa.Text(), nullable=True),
        sa.Column("parts_used", sa.Text(), nullable=True),
        sa.Column("engineer_user_id", sa.String(length=36), nullable=True),
        sa.Column("engineer_name", sa.String(length=255), nullable=True),
        sa.Column("completed_on", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["engineer_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("ticket_id", name="uq_ticket_responses_ticket_id"),
    )
    op.create_index("ix_ticket_responses_ticket_id", "ticket_responses", ["ticket_id"], unique=False)
    op.create_index(
        "ix_ticket_responses_engineer_user_id",
        "ticket_responses",
        ["engineer_user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_ticket_responses_engineer_user_id", table_name="ticket_responses")
    op.drop_index("ix_ticket_responses_ticket_id", table_name="ticket_responses")
    op.drop_table("ticket_responses")

