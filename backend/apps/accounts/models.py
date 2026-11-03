from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Custom user so the swap happens before any other migration (D-006).

    Extends AbstractUser with no extra fields: Phase 1 only needs a valid
    AUTH_USER_MODEL target.
    """
