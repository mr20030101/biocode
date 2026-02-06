"""Add departments table and department_id on equipment.

Revision ID: 0003_add_departments_and_department_to_equipment
Revises: 0002_add_user_password_hash
Create Date: 2026-02-06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_add_departments_and_department_to_equipment"
down_revision: Union[str, None] = "0002_add_user_password_hash"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "departments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("name", name="uq_departments_name"),
        sa.UniqueConstraint("code", name="uq_departments_code"),
    )

    with op.batch_alter_table("equipment") as batch_op:
        batch_op.add_column(
            sa.Column("department_id", sa.String(length=36), nullable=True),
        )
        batch_op.create_foreign_key(
            "fk_equipment_department_id_departments",
            "departments",
            ["department_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("equipment") as batch_op:
        batch_op.drop_constraint("fk_equipment_department_id_departments", type_="foreignkey")
        batch_op.drop_column("department_id")

    op.drop_table("departments")

