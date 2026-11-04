"""The ONE seam every board access goes through (docs/ARCHITECTURE.md, Auth).

Every queryset filter and perform_create calls get_current_user(); no other
module knows HOW the current user is resolved. Phase 8 swaps the body for
`return request.user` (SimpleJWT) and everything else keeps working.
"""

from typing import TYPE_CHECKING

from django.contrib.auth import get_user_model
from django.http import HttpRequest

if TYPE_CHECKING:
    from apps.accounts.models import User

# Kept as a constant so tests can reference it without duplicating the literal.
DEV_USERNAME = "dev"


def get_current_user(request: HttpRequest) -> "User":
    """Resolve the user this request acts on behalf of.

    Phase 8 replaces the body with `request.user`.
    Phase 2 (no auth yet): a seeded dev user. It must be UNUSABLE so nobody
    can ever log into it, and staff/superuser flags stay False so it gains
    no admin rights just by existing.
    """
    user_model = get_user_model()
    user, created = user_model.objects.get_or_create(username=DEV_USERNAME)
    if created:
        user.is_staff = False
        user.is_superuser = False
        user.set_unusable_password()
        user.save(update_fields=["is_staff", "is_superuser", "password"])
    return user
