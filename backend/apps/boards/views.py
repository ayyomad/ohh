"""Board API views. The only place boards are fetched — ownership is enforced
here for list AND object lookups, which is why another owner's board is a 404
and never a 403 (leaking existence via 403 would defeat the owner filter).
"""

from django.utils import timezone
from rest_framework import viewsets

from apps.accounts.current_user import get_current_user
from apps.boards.models import Board
from apps.boards.serializers import BoardSerializer

# Search longer than this is truncated, not rejected with 400: a too-long
# search is an honest user mistake, and truncation can never leak other
# owners' rows. Documented decision (the alternative was a 400).
SEARCH_MAX_LENGTH = 100


class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    # No PUT: PATCH (partial) is the only update verb the dashboard needs,
    # so the API keeps one code path for edits.
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        # The seam (Phase 8 will only change get_current_user's body) and
        # alive() keep soft-deleted rows invisible to reads AND object
        # lookups, so a deleted board behaves as nonexistent (404).
        queryset = Board.objects.alive().filter(
            owner=get_current_user(self.request)
        )
        search = self.request.query_params.get("search")
        if search is not None:
            search = search.strip()
            if search:
                # NOTE: no manual %/_ escaping. On our stack (Django 5.2 +
                # PostgreSQL) the icontains lookup escapes %, _ and \ inside
                # its pattern itself — verified empirically: searching raw "%"
                # matches only titles containing a literal "%", and a literal
                # "_" does not become a single-character wildcard. Manual
                # escaping here would DOUBLE-escape and break matching.
                queryset = queryset.filter(title__icontains=search[:SEARCH_MAX_LENGTH])
        # One deterministic total order ("-id" breaks updated_at ties), set
        # exactly once so there is never a second ORDER BY.
        return queryset.order_by("-updated_at", "-id")

    def perform_create(self, serializer) -> None:
        # The owner is ALWAYS the seam user; the request body never decides it.
        serializer.save(owner=get_current_user(self.request))

    def perform_destroy(self, instance) -> None:
        # Soft delete keeps the row for undo/export later; rows without
        # deleted_at are the only ones any query can see anyway. save() (not
        # update()) so auto_now bumps updated_at as required.
        instance.deleted_at = timezone.now()
        instance.save()
