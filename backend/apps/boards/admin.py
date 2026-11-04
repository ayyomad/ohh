"""Admin registration for boards."""

from django.contrib import admin

from apps.boards.models import Board


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    # deleted_at shown so soft-deleted rows are visible in the admin.
    list_display = ("title", "owner", "deleted_at", "updated_at")
