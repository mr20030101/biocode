"""update user roles

Revision ID: 0008_update_user_roles
Revises: 0007_add_repair_count_to_equipment
Create Date: 2026-02-07

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0008_update_user_roles'
down_revision = '0007_add_repair_count_to_equipment'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update existing 'admin' role to 'super_admin'
    op.execute("UPDATE users SET role = 'super_admin' WHERE role = 'admin'")
    
    # Note: SQLite doesn't support ALTER TYPE for enums
    # The enum constraint is handled at the application level in SQLAlchemy


def downgrade() -> None:
    # Revert 'super_admin' back to 'admin'
    op.execute("UPDATE users SET role = 'admin' WHERE role = 'super_admin'")
