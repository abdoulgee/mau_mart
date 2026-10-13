"""File uploads, stored in the database so they survive redeploys on hosts with no persistent disk.

Files are served from /api/v1/uploads/<folder>/<filename> (see routes/uploads.py). Older files that
were saved to app/uploads/ on disk are still served from there.
"""
import mimetypes

from app import db
from app.models import StoredFile


def upload_file(file_data, filename, folder=''):
    """Store an uploaded file and return its URL path. The caller commits the session."""
    data = file_data.read() if hasattr(file_data, 'read') else file_data
    path = f'{folder}/{filename}' if folder else filename

    StoredFile.query.filter_by(path=path).delete()
    db.session.add(StoredFile(
        path=path,
        content_type=mimetypes.guess_type(filename)[0] or 'application/octet-stream',
        data=data,
        size=len(data),
    ))
    return f'/api/v1/uploads/{path}'


def delete_file(url):
    """Remove a stored file by the URL upload_file returned. Caller commits."""
    marker = '/api/v1/uploads/'
    if url and marker in url:
        StoredFile.query.filter_by(path=url.split(marker, 1)[1]).delete()
