import sys

# Started directly (`python run.py`): patch for eventlet before anything else is imported.
# Gunicorn's eventlet worker patches by itself, and `flask` CLI commands don't need it.
if __name__ == '__main__':
    import eventlet
    eventlet.monkey_patch()

import os
from app import create_app, socketio

app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    socketio.run(
        app,
        debug=True,
        host='0.0.0.0',
        port=5000
    )
