"""Add ticket API fields

Revision ID: 0006_add_ticket_api_fields
Revises: 0005_normalize_ticket_service_report
Create Date: 2026-02-06
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0006_add_ticket_api_fields"
down_revision: Union[str, None] = "0005_normalize_ticket_service_report"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite doesn't support ALTER COLUMN, so we need to use batch operations
    with op.batch_alter_table('tickets', schema=None) as batch_op:
        # Add new columns
        batch_op.add_column(sa.Column('title', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('priority', sa.String(length=20), nullable=True, server_default='medium'))
        batch_op.add_column(sa.Column('reported_by_user_id', sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column('assigned_to_user_id', sa.String(length=36), nullable=True))
        
        # Add foreign keys
        batch_op.create_foreign_key('fk_tickets_reported_by_user', 'users', ['reported_by_user_id'], ['id'], ondelete='SET NULL')
        batch_op.create_foreign_key('fk_tickets_assigned_to_user', 'users', ['assigned_to_user_id'], ['id'], ondelete='SET NULL')
    
    # Update status enum values - we'll do this by updating existing data
    # First, update any existing tickets to use new status values
    conn = op.get_bind()
    conn.execute(sa.text("""
        UPDATE tickets 
        SET status = CASE 
            WHEN status = 'PENDING' THEN 'open'
            WHEN status = 'RESPONDED' THEN 'resolved'
            ELSE 'open'
        END
    """))


def downgrade() -> None:
    # Revert status values
    conn = op.get_bind()
    conn.execute(sa.text("""
        UPDATE tickets 
        SET status = CASE 
            WHEN status = 'open' THEN 'PENDING'
            WHEN status IN ('in_progress', 'resolved', 'closed') THEN 'RESPONDED'
            ELSE 'PENDING'
        END
    """))
    
    with op.batch_alter_table('tickets', schema=None) as batch_op:
        batch_op.drop_constraint('fk_tickets_assigned_to_user', type_='foreignkey')
        batch_op.drop_constraint('fk_tickets_reported_by_user', type_='foreignkey')
        batch_op.drop_column('assigned_to_user_id')
        batch_op.drop_column('reported_by_user_id')
        batch_op.drop_column('priority')
        batch_op.drop_column('description')
        batch_op.drop_column('title')
