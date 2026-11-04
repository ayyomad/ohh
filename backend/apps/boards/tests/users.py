"""Shared test users for boards tests."""

from django.contrib.auth import get_user_model

from apps.accounts.current_user import DEV_USERNAME, get_current_user


def make_users():
    """Returns (seam_user, other_user).

    The seam user is created through the seam itself, exactly like production
    does on the first request. The other user is created directly through the
    ORM, standing in for any person who is not the seam user. Neither needs a
    usable password: hashing is slow (it dominates setUp across ~dozens of
    tests) and no boards test ever logs in. The one test that needs real
    hashing does it itself (apps/accounts/tests.py).
    """
    seam_user = get_current_user(None)
    assert seam_user.username == DEV_USERNAME
    other_user = get_user_model().objects.create(username="other-person")
    other_user.set_unusable_password()
    other_user.save()
    return seam_user, other_user
