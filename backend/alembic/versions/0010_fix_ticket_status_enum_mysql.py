"""fix ticket status enum for mysql

Revision ID: 0010_fix_ticket_status_enum_mysql
Revises: 0009_fix_user_role_enum_mysql
Create Date: 2026-02-07

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0010_fix_ticket_status_enum_mysql'
down_revision = '0009_fix_user_role_enum_mysql'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # For MySQL, we need to alter the ENUM type for ticket status
    # Update any old status values if they exist
    op.execute("UPDATE tickets SET status = 'open' WHERE status = 'PENDING'")
    op.execute("UPDATE tickets SET status = 'closed' WHERE status = 'RESPONDED'")
    
    # Alter the column to use the new ENUM values
    op.execute("""
        ALTER TABLE tickets 
        MODIFY COLUMN status ENUM('open', 'in_progress', 'resolved', 'closed') 
        NOT NULL DEFAULT 'open'
    """)


def downgrade() -> None:
    # Revert back to old ENUM values
    op.execute("UPDATE tickets SET status = 'PENDING' WHERE status = 'open'")
    op.execute("UPDATE tickets SET status = 'RESPONDED' WHERE status = 'closed'")
    op.execute("""
        ALTER TABLE tickets 
        MODIFY COLUMN status ENUM('PENDING', 'RESPONDED') 
        NOT NULL DEFAULT 'PENDING'
    """)
