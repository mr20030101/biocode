"""create equipment history table

Revision ID: 0008_create_equipment_history_table
Revises: 0007_create_equipment_logs_table
Create Date: 2026-02-11 10:37:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0008_create_equipment_history_table'
down_revision = '0007_create_equipment_logs_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create equipment_history table
    op.create_table(
        'equipment_history',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('department', sa.String(length=255), nullable=False),
        sa.Column('equipment', sa.String(length=255), nullable=False),
        sa.Column('serial', sa.String(length=128), nullable=True),
        sa.Column('ticket_code', sa.String(length=32), nullable=True),
        sa.Column('ticket_id', sa.String(length=36), nullable=True),
        sa.Column('concern', sa.Text(), nullable=False),
        sa.Column('diagnosis', sa.Text(), nullable=True),
        sa.Column('action_taken', sa.Text(), nullable=True),
        sa.Column('parts_used', sa.Text(), nullable=True),
        sa.Column('engineer', sa.String(length=255), nullable=True),
        sa.Column('date_completed', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_equipment_history_ticket_code'), 'equipment_history', ['ticket_code'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_equipment_history_ticket_code'), table_name='equipment_history')
    op.drop_table('equipment_history')
