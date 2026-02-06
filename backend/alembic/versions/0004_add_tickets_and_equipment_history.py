"""Add tickets and equipment_history tables based on CLI script.

Revision ID: 0004_add_tickets_and_equipment_history
Revises: 0003_add_departments_and_department_to_equipment
Create Date: 2026-02-06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004_add_tickets_and_equipment_history"
down_revision: Union[str, None] = "0003_add_departments_and_department_to_equipment"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "tickets" not in existing_tables:
        op.create_table(
            "tickets",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("ticket_code", sa.String(length=32), nullable=False),
            sa.Column("from_department", sa.String(length=255), nullable=False),
            sa.Column("department_id", sa.String(length=36), nullable=True),
            sa.Column("equipment_service", sa.String(length=255), nullable=False),
            sa.Column("serial_number", sa.String(length=128), nullable=True),
            sa.Column("concern", sa.Text(), nullable=False),
            sa.Column("reported_by", sa.String(length=255), nullable=True),
            sa.Column(
                "status",
                sa.Enum("PENDING", "RESPONDED", name="ticketstatus"),
                nullable=False,
                server_default="PENDING",
            ),
            sa.Column("completed_on", sa.DateTime(timezone=True), nullable=True),
            sa.Column("equipment_id", sa.String(length=36), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["department_id"], ["departments.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["equipment_id"], ["equipment.id"], ondelete="SET NULL"),
            sa.UniqueConstraint("ticket_code", name="uq_tickets_ticket_code"),
        )
        op.create_index("ix_tickets_ticket_code", "tickets", ["ticket_code"], unique=False)

    if "equipment_history" not in existing_tables:
        op.create_table(
            "equipment_history",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("department", sa.String(length=255), nullable=False),
            sa.Column("equipment", sa.String(length=255), nullable=False),
            sa.Column("serial", sa.String(length=128), nullable=True),
            sa.Column("ticket_code", sa.String(length=32), nullable=True),
            sa.Column("ticket_id", sa.String(length=36), nullable=True),
            sa.Column("concern", sa.Text(), nullable=False),
            sa.Column("diagnosis", sa.Text(), nullable=True),
            sa.Column("action_taken", sa.Text(), nullable=True),
            sa.Column("parts_used", sa.Text(), nullable=True),
            sa.Column("engineer", sa.String(length=255), nullable=True),
            sa.Column("date_completed", sa.DateTime(timezone=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"], ondelete="SET NULL"),
        )
        op.create_index(
            "ix_equipment_history_ticket_code", "equipment_history", ["ticket_code"], unique=False
        )
        op.create_index(
            "ix_equipment_history_serial", "equipment_history", ["serial"], unique=False
        )


def downgrade() -> None:
    bind = op.get_bind()
    dialect_name = bind.dialect.name if bind is not None else ""

    op.drop_index("ix_equipment_history_serial", table_name="equipment_history")
    op.drop_index("ix_equipment_history_ticket_code", table_name="equipment_history")
    op.drop_table("equipment_history")

    op.drop_index("ix_tickets_ticket_code", table_name="tickets")
    op.drop_table("tickets")

    if dialect_name == "postgresql":
        op.execute("DROP TYPE IF EXISTS ticketstatus")

