"""add max_operating_hours to equipment

Revision ID: 6603a4218e02
Revises: 00cbcc70bd62
Create Date: 2026-03-04 15:27:12.806799

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6603a4218e02'
down_revision: Union[str, None] = '00cbcc70bd62'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.add_column('equipment', sa.Column(
        'max_operating_hours', sa.Integer(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:

    op.drop_column('equipment', 'max_operating_hours')
    # ### end Alembic commands ###
