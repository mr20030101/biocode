"""Initial equipment log schema.

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-02-06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "locations",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=True),
        sa.Column("building", sa.String(length=255), nullable=True),
        sa.Column("floor", sa.String(length=64), nullable=True),
        sa.Column("room", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("code", name="uq_locations_code"),
        sa.UniqueConstraint("name", "building", "floor", "room", name="uq_locations_identity"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.Enum("admin", "tech", "viewer", name="userrole"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)

    op.create_table(
        "equipment",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("asset_tag", sa.String(length=64), nullable=False),
        sa.Column("serial_number", sa.String(length=128), nullable=True),
        sa.Column("device_name", sa.String(length=255), nullable=False),
        sa.Column("manufacturer", sa.String(length=255), nullable=True),
        sa.Column("model", sa.String(length=255), nullable=True),
        sa.Column(
            "status",
            sa.Enum("active", "out_of_service", "retired", name="equipmentstatus"),
            nullable=False,
        ),
        sa.Column("location_id", sa.String(length=36), nullable=True),
        sa.Column("in_service_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["location_id"], ["locations.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("asset_tag", name="uq_equipment_asset_tag"),
    )
    op.create_index("ix_equipment_device_name", "equipment", ["device_name"], unique=False)
    op.create_index(
        "ix_equipment_manufacturer_model", "equipment", ["manufacturer", "model"], unique=False
    )

    op.create_table(
        "equipment_logs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("equipment_id", sa.String(length=36), nullable=False),
        sa.Column("created_by_user_id", sa.String(length=36), nullable=True),
        sa.Column(
            "log_type",
            sa.Enum(
                "service",
                "preventive_maintenance",
                "incident",
                "calibration",
                "inspection",
                "note",
                name="logtype",
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("downtime_minutes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("resolved", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("downtime_minutes >= 0", name="ck_equipment_logs_downtime_nonneg"),
        sa.ForeignKeyConstraint(["equipment_id"], ["equipment.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_equipment_logs_created_by_user_id", "equipment_logs", ["created_by_user_id"])
    op.create_index("ix_equipment_logs_equipment_id", "equipment_logs", ["equipment_id"])
    op.create_index("ix_equipment_logs_log_type", "equipment_logs", ["log_type"])
    op.create_index(
        "ix_equipment_logs_equipment_type",
        "equipment_logs",
        ["equipment_id", "log_type"],
        unique=False,
    )
    op.create_index("ix_equipment_logs_occurred_at", "equipment_logs", ["occurred_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_equipment_logs_occurred_at", table_name="equipment_logs")
    op.drop_index("ix_equipment_logs_equipment_type", table_name="equipment_logs")
    op.drop_index("ix_equipment_logs_log_type", table_name="equipment_logs")
    op.drop_index("ix_equipment_logs_equipment_id", table_name="equipment_logs")
    op.drop_index("ix_equipment_logs_created_by_user_id", table_name="equipment_logs")
    op.drop_table("equipment_logs")

    op.drop_index("ix_equipment_manufacturer_model", table_name="equipment")
    op.drop_index("ix_equipment_device_name", table_name="equipment")
    op.drop_table("equipment")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.drop_table("locations")

    # Enum cleanup for PostgreSQL only; MySQL/SQLite don't use named types.
    bind = op.get_bind()
    dialect_name = bind.dialect.name if bind is not None else ""
    if dialect_name == "postgresql":
        op.execute("DROP TYPE IF EXISTS logtype")
        op.execute("DROP TYPE IF EXISTS equipmentstatus")
        op.execute("DROP TYPE IF EXISTS userrole")

