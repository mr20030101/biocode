"""add repair_count to equipment

Revision ID: 0007_add_repair_count_to_equipment
Revises: 0006_add_ticket_api_fields
Create Date: 2026-02-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0007_add_repair_count_to_equipment'
down_revision = '0006_add_ticket_api_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add repair_count column with default value of 0
    with op.batch_alter_table('equipment', schema=None) as batch_op:
        batch_op.add_column(sa.Column('repair_count', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    # Remove repair_count column
    with op.batch_alter_table('equipment', schema=None) as batch_op:
        batch_op.drop_column('repair_count')
