"""ASGI entry point for the OHh backend.

Kept alongside wsgi.py for future WebSocket consumers (Hocuspocus talks to a
separate Node service, D-003, so Django ASGI must stay minimal for now).
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_asgi_application()
