import eventlet
eventlet.monkey_patch()

from flask.ctx import RequestContext
# Patch RequestContext.session for Flask 3 compatibility with older Flask-SocketIO
def _patch_session():
    original_session = RequestContext.session
    def fget(self):
        if hasattr(self, '_session_obj'):
            return self._session_obj
        return original_session.fget(self)
    def fset(self, value):
        self._session_obj = value
    RequestContext.session = property(fget, fset)
_patch_session()

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
