"""Tests for the health endpoint and its degraded mode."""

from unittest.mock import patch

from rest_framework.test import APITestCase


class TestHealthEndpoint(APITestCase):
    def test_health_returns_ok_when_database_is_reachable(self) -> None:
        response = self.client.get("/api/v1/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "ok", "database": "ok", "version": "0.1.0"},
        )

    def test_health_returns_503_when_database_check_fails(self) -> None:
        with patch("apps.core.views.database_is_reachable", side_effect=OSError):
            response = self.client.get("/api/v1/health/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {"status": "degraded", "database": "error", "version": "0.1.0"},
        )
