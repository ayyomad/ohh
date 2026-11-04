"""Boards API URLs, mounted at /api/v1/boards/ by config/urls.py."""

from rest_framework.routers import DefaultRouter

from apps.boards.views import BoardViewSet

router = DefaultRouter()
router.register("boards", BoardViewSet, basename="board")

urlpatterns = router.urls
