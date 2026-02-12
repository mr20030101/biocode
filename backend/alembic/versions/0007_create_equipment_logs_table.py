"""create equipment logs table

Revision ID: 0007_create_equipment_logs_table
Revises: 0006_create_tickets_table
Create Date: 2026-02-11 10:36:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0007_create_equipment_logs_table'
down_revision = '0006_create_tickets_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create equipment_logs table
    op.create_table(
        'equipment_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('equipment_id', sa.String(length=36), nullable=False),
        sa.Column('created_by_user_id', sa.String(length=36), nullable=True),
        sa.Column('log_type', sa.Enum('service', 'preventive_maintenance', 'incident', 'calibration', 'inspection', 'note', name='logtype'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('downtime_minutes', sa.Integer(), nullable=False),
        sa.Column('resolved', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint('downtime_minutes >= 0', name='ck_equipment_logs_downtime_nonneg'),
        sa.ForeignKeyConstraint(['equipment_id'], ['equipment.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_equipment_logs_equipment_id'), 'equipment_logs', ['equipment_id'], unique=False)
    op.create_index(op.f('ix_equipment_logs_created_by_user_id'), 'equipment_logs', ['created_by_user_id'], unique=False)
    op.create_index(op.f('ix_equipment_logs_log_type'), 'equipment_logs', ['log_type'], unique=False)
    op.create_index(op.f('ix_equipment_logs_equipment_type'), 'equipment_logs', ['equipment_id', 'log_type'], unique=False)
    op.create_index(op.f('ix_equipment_logs_occurred_at'), 'equipment_logs', ['occurred_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_equipment_logs_occurred_at'), table_name='equipment_logs')
    op.drop_index(op.f('ix_equipment_logs_equipment_type'), table_name='equipment_logs')
    op.drop_index(op.f('ix_equipment_logs_log_type'), table_name='equipment_logs')
    op.drop_index(op.f('ix_equipment_logs_created_by_user_id'), table_name='equipment_logs')
    op.drop_index(op.f('ix_equipment_logs_equipment_id'), table_name='equipment_logs')
    op.drop_table('equipment_logs')
