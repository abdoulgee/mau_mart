"""stored files: keep uploaded images in the database

Revision ID: a7c2e91b4d10
Revises: f84139d1c8db
Create Date: 2026-10-13 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a7c2e91b4d10'
down_revision = 'f84139d1c8db'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'stored_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('path', sa.String(length=300), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=False),
        sa.Column('data', sa.LargeBinary(), nullable=False),
        sa.Column('size', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_stored_files_path'), 'stored_files', ['path'], unique=True)


def downgrade():
    op.drop_index(op.f('ix_stored_files_path'), table_name='stored_files')
    op.drop_table('stored_files')
