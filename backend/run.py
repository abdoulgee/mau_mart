import os
from app import create_app, socketio

app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    # Development server. In production gunicorn serves `app` (see render.yaml).
    socketio.run(
        app,
        debug=True,
        host='0.0.0.0',
        port=5000,
        allow_unsafe_werkzeug=True,  # run.py is for local development only
    )
