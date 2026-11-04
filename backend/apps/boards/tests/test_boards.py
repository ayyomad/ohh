"""CRUD + validation behaviour of the boards API."""

import uuid

from rest_framework import status
from rest_framework.test import APITestCase

from apps.boards.models import Board
from apps.boards.tests.users import make_users

DEFAULT_SETTINGS = {"appearance": "light", "background": "dots"}


class TestCreateBoard(APITestCase):
    def setUp(self):
        self.user, self.other_user = make_users()

    def test_create_returns_201_with_defaults(self) -> None:
        response = self.client.post("/api/v1/boards/", {"title": "Moodboard"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Moodboard")
        self.assertEqual(response.data["description"], "")
        self.assertEqual(response.data["settings"], DEFAULT_SETTINGS)
        self.assertTrue(response.data["id"])
        board = Board.objects.get()
        self.assertEqual(board.owner, self.user)

    def test_create_ignores_protected_fields_in_payload(self) -> None:
        # A hostile or buggy client must not be able to choose id, owner or
        # lifecycle timestamps; the response simply differs (and the row's
        # owner is always the seam user).
        pretend_id = str(uuid.uuid4())
        payload = {
            "title": "Moodboard",
            "id": pretend_id,
            "owner": self.other_user.pk,
            "created_at": "1999-01-01T00:00:00Z",
            "deleted_at": "1999-01-01T00:00:00Z",
        }
        # format="json": real clients send JSON; also lets nested dicts reach
        # the serializer (multipart would strip nested data silently).
        response = self.client.post("/api/v1/boards/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data["id"], pretend_id)
        self.assertEqual(Board.objects.get().owner, self.user)
        self.assertIsNone(Board.objects.get().deleted_at)
        # created_at too: the payload's 1999 must never reach the row.
        self.assertNotEqual(Board.objects.get().created_at.year, 1999)


class TestValidation(APITestCase):
    def setUp(self):
        self.user, self.other_user = make_users()

    def post(self, payload):
        # format="json": settings is a nested dict, and APIClient would
        # otherwise default to multipart, where nested data is unsupported.
        return self.client.post("/api/v1/boards/", payload, format="json")

    def test_blank_title_rejected(self) -> None:
        self.assertEqual(self.post({"title": ""}).status_code, 400)
        self.assertEqual(self.post({"title": "   "}).status_code, 400)

    def test_title_over_120_rejected(self) -> None:
        response = self.post({"title": "x" * 121})
        self.assertEqual(response.status_code, 400)

    def test_title_120_ok(self) -> None:
        response = self.post({"title": "x" * 120})
        self.assertEqual(response.status_code, 201)

    def test_description_over_2000_rejected(self) -> None:
        response = self.post({"title": "B", "description": "d" * 2001})
        self.assertEqual(response.status_code, 400)

    def test_invalid_appearance_rejected(self) -> None:
        response = self.post(
            {"title": "B", "settings": {"appearance": "blue", "background": "dots"}}
        )
        self.assertEqual(response.status_code, 400)

    def test_invalid_background_rejected(self) -> None:
        response = self.post(
            {"title": "B", "settings": {"appearance": "light", "background": "checker"}}
        )
        self.assertEqual(response.status_code, 400)

    def test_unknown_settings_key_rejected(self) -> None:
        # DRF ignores unknown keys by default; the dashboard relies on a
        # strict schema, so this must be a 400, not a silent drop.
        response = self.post(
            {
                "title": "B",
                "settings": {
                    "appearance": "light",
                    "background": "dots",
                    "accent": "orange",
                },
            }
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("accent", response.data["settings"])

    def test_settings_missing_key_rejected(self) -> None:
        response = self.post({"title": "B", "settings": {"appearance": "light"}})
        self.assertEqual(response.status_code, 400)
        self.assertIn("background", response.data["settings"])

    def test_settings_not_an_object_rejected(self) -> None:
        response = self.post({"title": "B", "settings": "dark"})
        self.assertEqual(response.status_code, 400)


class TestPatchBoard(APITestCase):
    def setUp(self):
        self.user, self.other_user = make_users()
        self.board = Board.objects.create(
            owner=self.user,
            title="Original",
            description="Some notes",
            settings={"appearance": "light", "background": "grid"},
        )

    def patch(self, payload):
        return self.client.patch(
            f"/api/v1/boards/{self.board.id}/", payload, format="json"
        )

    def test_title_only_patch_keeps_settings_and_description(self) -> None:
        response = self.patch({"title": "  Renamed  "})
        self.assertEqual(response.status_code, 200)
        self.board.refresh_from_db()
        self.assertEqual(self.board.title, "Renamed")  # trimmed, per spec
        self.assertEqual(self.board.description, "Some notes")
        self.assertEqual(
            self.board.settings, {"appearance": "light", "background": "grid"}
        )

    def test_settings_patch_replaces_the_whole_object(self) -> None:
        response = self.patch({"settings": {"appearance": "dark", "background": "plain"}})
        self.assertEqual(response.status_code, 200)
        self.board.refresh_from_db()
        self.assertEqual(
            self.board.settings, {"appearance": "dark", "background": "plain"}
        )
        self.assertEqual(self.board.title, "Original")

    def test_patch_validation_errors_are_400(self) -> None:
        self.assertEqual(self.patch({"title": "   "}).status_code, 400)
        self.assertEqual(
            self.patch({"settings": {"appearance": "dark"}}).status_code, 400
        )


class TestOtherOwnersBoardsAreInvisible(APITestCase):
    """Because get_queryset always filters by the seam owner, another user's
    board is simply not found — 404 on every verb, response identical to a
    nonexistent board (no 403 that would confirm existence)."""

    def setUp(self):
        self.user, self.other_user = make_users()
        self.frozen_board = Board.objects.create(
            owner=self.other_user,
            title="Not Yours",
        )

    def url(self) -> str:
        return f"/api/v1/boards/{self.frozen_board.id}/"

    def test_retrieve_is_404(self) -> None:
        response = self.client.get(self.url())
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["detail"].code, "not_found")

    def test_patch_is_404_and_leaves_row_unchanged(self) -> None:
        before_updated_at = self.frozen_board.updated_at
        response = self.client.patch(self.url(), {"title": "Hacked"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.frozen_board.refresh_from_db()
        self.assertEqual(self.frozen_board.title, "Not Yours")
        self.assertEqual(self.frozen_board.updated_at, before_updated_at)

    def test_delete_is_404_and_leaves_row_alive(self) -> None:
        response = self.client.delete(self.url())
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.frozen_board.refresh_from_db()
        self.assertIsNone(self.frozen_board.deleted_at)


class TestBadIds(APITestCase):
    def setUp(self):
        self.user, self.other_user = make_users()

    def test_malformed_id_is_404(self) -> None:
        response = self.client.get("/api/v1/boards/not-a-uuid/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_nonexistent_uuid_is_404(self) -> None:
        response = self.client.get(f"/api/v1/boards/{uuid.uuid4()}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
