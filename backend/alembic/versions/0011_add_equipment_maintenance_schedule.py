"""add equipment maintenance schedule

Revision ID: 0011_add_equipment_maintenance_schedule
Revises: 0010_fix_ticket_status_enum_mysql
Create Date: 2026-02-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '0011_add_equipment_maintenance_schedule'
down_revision = '0010_fix_ticket_status_enum_mysql'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create maintenance_schedules table
    op.create_table(
        'maintenance_schedules',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('equipment_id', sa.String(36), sa.ForeignKey('equipment.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('maintenance_type', sa.String(50), nullable=False),  # preventive, calibration, inspection, etc.
        sa.Column('frequency_days', sa.Integer, nullable=False),  # How often in days
        sa.Column('last_maintenance_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('next_maintenance_date', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('assigned_to_user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('maintenance_schedules')
