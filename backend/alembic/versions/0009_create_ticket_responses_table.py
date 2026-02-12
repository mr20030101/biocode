"""create ticket responses table

Revision ID: 0009_create_ticket_responses_table
Revises: 0008_create_equipment_history_table
Create Date: 2026-02-11 10:38:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0009_create_ticket_responses_table'
down_revision = '0008_create_equipment_history_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
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


def downgrade() -> None:
    op.drop_index(op.f('ix_ticket_responses_engineer_user_id'), table_name='ticket_responses')
    op.drop_index(op.f('ix_ticket_responses_ticket_id'), table_name='ticket_responses')
    op.drop_table('ticket_responses')
