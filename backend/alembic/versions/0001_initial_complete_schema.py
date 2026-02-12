"""initial complete schema

Revision ID: 0001_initial_complete_schema
Revises: 
Create Date: 2026-02-11 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '0001_initial_complete_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create departments table
    op.create_table(
        'departments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=64), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('code')
    )

    # Create suppliers table
    op.create_table(
        'suppliers',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=64), nullable=True),
        sa.Column('contact_person', sa.String(length=255), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('code')
    )

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('super_admin', 'manager', 'department_head', 'support', 'department_incharge', name='userrole'), nullable=False),
        sa.Column('support_type', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('department_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=False)
    op.create_index(op.f('ix_users_department_id'), 'users', ['department_id'], unique=False)

    # Create locations table
    op.create_table(
        'locations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=64), nullable=True),
        sa.Column('building', sa.String(length=255), nullable=True),
        sa.Column('floor', sa.String(length=64), nullable=True),
        sa.Column('room', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
        sa.UniqueConstraint('name', 'building', 'floor', 'room', name='uq_locations_identity')
    )

    # Create equipment table
    op.create_table(
        'equipment',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('asset_tag', sa.String(length=64), nullable=False),
        sa.Column('serial_number', sa.String(length=128), nullable=True),
        sa.Column('device_name', sa.String(length=255), nullable=False),
        sa.Column('manufacturer', sa.String(length=255), nullable=True),
        sa.Column('model', sa.String(length=255), nullable=True),
        sa.Column('supplier_id', sa.String(length=36), nullable=True),
        sa.Column('acquisition_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('acquired_value', sa.String(length=50), nullable=True),
        sa.Column('status', sa.Enum('active', 'out_of_service', 'retired', name='equipmentstatus'), nullable=False),
        sa.Column('location_id', sa.String(length=36), nullable=True),
        sa.Column('department_id', sa.String(length=36), nullable=True),
        sa.Column('in_service_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('repair_count', sa.Integer(), nullable=False),
        sa.Column('total_downtime_minutes', sa.Integer(), nullable=False),
        sa.Column('last_downtime_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_currently_down', sa.Boolean(), nullable=False),
        sa.Column('criticality', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('asset_tag', name='uq_equipment_asset_tag')
    )
    op.create_index(op.f('ix_equipment_device_name'), 'equipment', ['device_name'], unique=False)
    op.create_index(op.f('ix_equipment_manufacturer_model'), 'equipment', ['manufacturer', 'model'], unique=False)
    op.create_index(op.f('ix_equipment_supplier_id'), 'equipment', ['supplier_id'], unique=False)
    op.create_index(op.f('ix_equipment_is_currently_down'), 'equipment', ['is_currently_down'], unique=False)
    op.create_index(op.f('ix_equipment_criticality'), 'equipment', ['criticality'], unique=False)

    # Create tickets table
    op.create_table(
        'tickets',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('ticket_code', sa.String(length=32), nullable=False),
        sa.Column('from_department', sa.String(length=255), nullable=False),
        sa.Column('department_id', sa.String(length=36), nullable=True),
        sa.Column('equipment_service', sa.String(length=255), nullable=False),
        sa.Column('serial_number', sa.String(length=128), nullable=True),
        sa.Column('concern', sa.Text(), nullable=False),
        sa.Column('reported_by', sa.String(length=255), nullable=True),
        sa.Column('status', sa.Enum('open', 'in_progress', 'resolved', 'closed', name='ticketstatus'), nullable=False),
        sa.Column('completed_on', sa.DateTime(timezone=True), nullable=True),
        sa.Column('equipment_id', sa.String(length=36), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.String(length=20), nullable=True),
        sa.Column('reported_by_user_id', sa.String(length=36), nullable=True),
        sa.Column('assigned_to_user_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['equipment_id'], ['equipment.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['reported_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['assigned_to_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ticket_code')
    )
    op.create_index(op.f('ix_tickets_ticket_code'), 'tickets', ['ticket_code'], unique=False)

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

    # Create ticket_responses table
    op.create_table(
        'ticket_responses',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('ticket_id', sa.String(length=36), nullable=False),
        sa.Column('diagnosis', sa.Text(), nullable=True),
        sa.Column('action_taken', sa.Text(), nullable=True),
        sa.Column('parts_used', sa.Text(), nullable=True),
        sa.Column('engineer_user_id', sa.String(length=36), nullable=True),
        sa.Column('engineer_name', sa.String(length=255), nullable=True),
        sa.Column('completed_on', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['engineer_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ticket_id')
    )
    op.create_index(op.f('ix_ticket_responses_ticket_id'), 'ticket_responses', ['ticket_id'], unique=False)
    op.create_index(op.f('ix_ticket_responses_engineer_user_id'), 'ticket_responses', ['engineer_user_id'], unique=False)

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

    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('related_entity_type', sa.String(length=50), nullable=True),
        sa.Column('related_entity_id', sa.String(length=36), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_notifications_notification_type'), 'notifications', ['notification_type'], unique=False)
    op.create_index(op.f('ix_notifications_is_read'), 'notifications', ['is_read'], unique=False)
    op.create_index(op.f('ix_notifications_created_at'), 'notifications', ['created_at'], unique=False)
    op.create_index(op.f('ix_notifications_user_read'), 'notifications', ['user_id', 'is_read'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('notifications')
    op.drop_table('maintenance_schedules')
    op.drop_table('ticket_responses')
    op.drop_table('equipment_history')
    op.drop_table('equipment_logs')
    op.drop_table('tickets')
    op.drop_table('equipment')
    op.drop_table('locations')
    op.drop_table('suppliers')
    op.drop_table('users')
    op.drop_table('departments')
