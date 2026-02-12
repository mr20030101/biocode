"""add user preferences

Revision ID: 0002_add_user_preferences
Revises: 0001_initial_complete_schema
Create Date: 2026-02-12

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0002_add_user_preferences'
down_revision = '0001_initial_complete_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add preferences column to users table
    op.add_column('users', sa.Column('preferences', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove preferences column from users table
    op.drop_column('users', 'preferences')
