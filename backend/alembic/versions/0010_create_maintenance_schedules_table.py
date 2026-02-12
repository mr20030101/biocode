"""create maintenance schedules table

Revision ID: 0010_create_maintenance_schedules_table
Revises: 0009_create_ticket_responses_table
Create Date: 2026-02-11 10:39:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0010_create_maintenance_schedules_table'
down_revision = '0009_create_ticket_responses_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create maintenance_schedules table
    op.create_table(
        'maintenance_schedules',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('equipment_id', sa.String(length=36), nullable=False),
        sa.Column('maintenance_type', sa.String(length=50), nullable=False),
        sa.Column('frequency_days', sa.Integer(), nullable=False),
        sa.Column('last_maintenance_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('next_maintenance_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('assigned_to_user_id', sa.String(length=36), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['equipment_id'], ['equipment.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_to_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_schedules_equipment_id'), 'maintenance_schedules', ['equipment_id'], unique=False)
    op.create_index(op.f('ix_maintenance_schedules_next_maintenance_date'), 'maintenance_schedules', ['next_maintenance_date'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_maintenance_schedules_next_maintenance_date'), table_name='maintenance_schedules')
    op.drop_index(op.f('ix_maintenance_schedules_equipment_id'), table_name='maintenance_schedules')
    op.drop_table('maintenance_schedules')
