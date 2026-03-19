"""add service history manual

Revision ID: 71af9f4af7f1
Revises: d36af6f8c24b
Create Date: 2026-03-17 13:15:37.073745

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '71af9f4af7f1'
down_revision: Union[str, None] = 'd36af6f8c24b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'service_history',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('equipment_id', sa.String(36)),
        sa.Column('date', sa.Date()),
        sa.Column('work_done', sa.String(255)),
        sa.Column('engineer', sa.String(100)),
        sa.ForeignKeyConstraint(['equipment_id'], ['equipment.id'])
    )


def downgrade() -> None:
    op.drop_table('service_history')
