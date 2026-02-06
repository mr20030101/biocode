"""fix user role enum for mysql

Revision ID: 0009_fix_user_role_enum_mysql
Revises: 0008_update_user_roles
Create Date: 2026-02-07

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0009_fix_user_role_enum_mysql'
down_revision = '0008_update_user_roles'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # For MySQL, we need to alter the ENUM type
    # First, update any existing 'admin' values to 'super_admin'
    op.execute("UPDATE users SET role = 'super_admin' WHERE role = 'admin'")
    
    # Alter the column to use the new ENUM values
    op.execute("""
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('super_admin', 'supervisor', 'tech', 'viewer') 
        NOT NULL DEFAULT 'tech'
    """)


def downgrade() -> None:
    # Revert back to old ENUM values
    op.execute("UPDATE users SET role = 'admin' WHERE role = 'super_admin'")
    op.execute("""
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('admin', 'tech', 'viewer') 
        NOT NULL DEFAULT 'tech'
    """)
