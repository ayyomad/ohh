"""Health endpoint for /api/v1/ (docs/API_DESIGN.md)."""

from django.db import connection
from django.db.utils import DatabaseError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

VERSION = "0.1.0"


def database_is_reachable() -> bool:
    """Run a trivial query to prove the database connection works."""
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()
    return True


class HealthView(APIView):
    """Liveness/readiness in one endpoint: 200 ok or 503 degraded."""

    def get(self, request: Request) -> Response:
        del request  # unused; APIView requires the signature
        try:
            database_is_reachable()
        except (DatabaseError, ConnectionError, OSError):
            # Broken DB is reported, not raised: Docker/orchestration tooling
            # can watch the 503 and the shape stays stable for the frontend.
            return Response(
                {"status": "degraded", "database": "error", "version": VERSION},
                status=503,
            )
        return Response({"status": "ok", "database": "ok", "version": VERSION})
