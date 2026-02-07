"""add_department_to_users

Revision ID: 677dd99400be
Revises: 0011_add_equipment_maintenance_schedule
Create Date: 2026-02-07 12:24:06.530735

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '677dd99400be'
down_revision: Union[str, None] = '0011_add_equipment_maintenance_schedule'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add department_id column to users table
    op.add_column('users', sa.Column('department_id', sa.String(36), nullable=True))
    op.create_foreign_key('fk_users_department', 'users', 'departments', ['department_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_users_department_id', 'users', ['department_id'])


def downgrade() -> None:
    # Remove department_id column from users table
    op.drop_index('ix_users_department_id', 'users')
    op.drop_constraint('fk_users_department', 'users', type_='foreignkey')
    op.drop_column('users', 'department_id')

