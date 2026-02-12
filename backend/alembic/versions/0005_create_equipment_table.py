"""create equipment table

Revision ID: 0005_create_equipment_table
Revises: 0004_create_locations_table
Create Date: 2026-02-11 10:34:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0005_create_equipment_table'
down_revision = '0004_create_locations_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
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


def downgrade() -> None:
    op.drop_index(op.f('ix_equipment_criticality'), table_name='equipment')
    op.drop_index(op.f('ix_equipment_is_currently_down'), table_name='equipment')
    op.drop_index(op.f('ix_equipment_supplier_id'), table_name='equipment')
    op.drop_index(op.f('ix_equipment_manufacturer_model'), table_name='equipment')
    op.drop_index(op.f('ix_equipment_device_name'), table_name='equipment')
    op.drop_table('equipment')
