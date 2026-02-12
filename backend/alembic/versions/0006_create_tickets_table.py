"""create tickets table

Revision ID: 0006_create_tickets_table
Revises: 0005_create_equipment_table
Create Date: 2026-02-11 10:35:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0006_create_tickets_table'
down_revision = '0005_create_equipment_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
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


def downgrade() -> None:
    op.drop_index(op.f('ix_tickets_ticket_code'), table_name='tickets')
    op.drop_table('tickets')
