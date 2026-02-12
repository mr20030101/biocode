"""create locations table

Revision ID: 0004_create_locations_table
Revises: 0003_create_users_table
Create Date: 2026-02-11 10:33:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0004_create_locations_table'
down_revision = '0003_create_users_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
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


def downgrade() -> None:
    op.drop_table('locations')
