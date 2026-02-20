"""
Supabase Storage helper for file uploads.
Falls back to local file storage if Supabase is not configured.
"""
import os
from flask import current_app


def _get_supabase_client():
    """Get Supabase client if configured, else return None.
    Prefers SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) over SUPABASE_KEY (anon).
    """
    url = os.getenv('SUPABASE_URL')
    # Prefer service_role key for server-side uploads (bypasses RLS)
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY')
    if not url or not key or key == 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE':
        return None
    try:
        from supabase import create_client
        return create_client(url, key)
    except Exception as e:
        print(f"Warning: Could not create Supabase client: {e}")
        return None


def upload_file(file_data, filename, bucket='uploads', folder=''):
    """
    Upload a file either to Supabase Storage or locally.
    Returns the public URL of the uploaded file.
    """
    client = _get_supabase_client()
    path = f"{folder}/{filename}" if folder else filename

    if client:
        # Upload to Supabase Storage
        try:
            # Ensure bucket exists
            try:
                client.storage.get_bucket(bucket)
            except Exception:
                client.storage.create_bucket(bucket, options={"public": True})

            result = client.storage.from_(bucket).upload(
                path,
                file_data,
                file_options={"content-type": "application/octet-stream", "upsert": "true"}
            )
            # Return public URL
            public_url = client.storage.from_(bucket).get_public_url(path)
            print(f"✅ Supabase Upload Success: bucket={bucket}, path={path}")
            print(f"🔗 Public URL: {public_url}")
            return public_url
        except Exception as e:
            print(f"❌ Supabase upload failed, falling back to local: {e}")
            # Fall through to local storage

    # Local storage fallback
    backend_url = os.getenv('BACKEND_URL', '').rstrip('/')
    upload_path = f'/api/v1/uploads/{folder}/{filename}'
    
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], folder)
    os.makedirs(upload_folder, exist_ok=True)
    filepath = os.path.join(upload_folder, filename)

    # file_data can be bytes or a FileStorage object
    if hasattr(file_data, 'save'):
        file_data.save(filepath)
    else:
        with open(filepath, 'wb') as f:
            f.write(file_data)

    return f"{backend_url}{upload_path}" if backend_url else upload_path


def get_file_url(folder, filename):
    """Get the public URL for a file."""
    client = _get_supabase_client()
    if client:
        path = f"{folder}/{filename}"
        return client.storage.from_('uploads').get_public_url(path)
    
    backend_url = os.getenv('BACKEND_URL', '').rstrip('/')
    upload_path = f'/api/v1/uploads/{folder}/{filename}'
    return f"{backend_url}{upload_path}" if backend_url else upload_path
