"""API surface in apps.core. Only infrastructure endpoints, no versioning churn."""

from django.urls import path

from apps.core.views import HealthView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
]
