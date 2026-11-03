"""Admin registration for the custom user model."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.accounts.models import User


@admin.register(User)
class OhhUserAdmin(UserAdmin):
    """Re-use Django's fieldsets so user admin works out of the box."""

    pass
