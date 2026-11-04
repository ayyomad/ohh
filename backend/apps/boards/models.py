"""Board model: the only user-facing row in Phase 2."""

import uuid
from typing import Any

# Imported under an alias because the model below has a field named `settings`.
from django.conf import settings as django_settings
from django.db import models


def default_board_settings() -> dict[str, Any]:
    """Module-level callable: JSONField default MUST be callable, otherwise
    every board would share one mutated dict."""
    return {"appearance": "light", "background": "dots"}


class BoardQuerySet(models.QuerySet):
    def alive(self) -> "BoardQuerySet":
        """Soft-deleted rows behave as nonexistent everywhere: one filter to
        remember instead of scattered deleted_at__isnull checks."""
        return self.filter(deleted_at__isnull=True)


class Board(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # settings.AUTH_USER_MODEL keeps the FK swappable (D-006); the aliasing is
    # mandated by the field named `settings` below.
    owner = models.ForeignKey(
        django_settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="boards",
    )
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True, default="")
    settings = models.JSONField(default=default_board_settings)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = BoardQuerySet.as_manager()

    def __str__(self) -> str:
        return self.title
