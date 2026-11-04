"""List behaviour: ownership, soft delete visibility, search, ordering,
pagination."""

import datetime

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.boards.models import Board
from apps.boards.tests.users import make_users


def board_url(board) -> str:
    return f"/api/v1/boards/{board.id}/"


class TestListOwnership(APITestCase):
    def setUp(self):
        self.user, self.other_user = make_users()
        Board.objects.create(owner=self.user, title="Yours A")
        Board.objects.create(owner=self.user, title="Yours B")
        Board.objects.create(owner=self.other_user, title="Theirs")

    def test_list_contains_only_the_seam_users_boards(self) -> None:
        response = self.client.get("/api/v1/boards/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [b["title"] for b in response.data["results"]]
        self.assertEqual(titles, ["Yours B", "Yours A"])  # newest updated first
        self.assertNotIn("Theirs", titles)
        self.assertEqual(response.data["count"], 2)


class TestOrdering(APITestCase):
    def setUp(self):
        self.user, self.other_user = make_users()

    def test_most_recently_updated_first(self) -> None:
        first = Board.objects.create(owner=self.user, title="First")
        Board.objects.create(owner=self.user, title="Second")
        # Touching First now makes it the most recently updated.
        first.title = "First (edited)"
        first.save()

        response = self.client.get("/api/v1/boards/")
        titles = [b["title"] for b in response.data["results"]]
        self.assertEqual(titles, ["First (edited)", "Second"])


class TestSearch(APITestCase):
    def setUp(self):
        self.user, self.other_user = make_users()
        self.percent_board = Board.objects.create(owner=self.user, title="100% Board")
        self.plain_board = Board.objects.create(owner=self.user, title="Plain plan")
        Board.objects.create(owner=self.other_user, title="Sketch (theirs)")

    def results_for(self, raw_search: str) -> list[str]:
        response = self.client.get("/api/v1/boards/", {"search": raw_search})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return [b["title"] for b in response.data["results"]]

    def test_case_insensitive_substring_match(self) -> None:
        titles = self.results_for("SKETCH")
        self.assertEqual(titles, [])  # the "theirs" sketch must not match

        Board.objects.create(owner=self.user, title="Sketch Plan")
        self.assertEqual(self.results_for("sketch"), ["Sketch Plan"])

    def test_percent_is_matched_literally(self) -> None:
        # A bare % must not degrade into "match everything".
        self.assertEqual(self.results_for("%"), ["100% Board"])

    def test_underscore_is_matched_literally(self) -> None:
        # A bare _ must not degrade into a single-character wildcard (the
        # documented SQL-escape behaviour in views.py).
        Board.objects.create(owner=self.user, title="under_score")
        self.assertEqual(self.results_for("_"), ["under_score"])

    def test_empty_and_whitespace_search_return_everything(self) -> None:
        self.assertEqual(sorted(self.results_for("  ")), ["100% Board", "Plain plan"])

    def test_long_search_is_truncated_not_rejected(self) -> None:
        # Documented decision: >100 chars are truncated (see views.py).
        # The title contains exactly the FIRST 100 chars of the search, so a
        # correct truncation matches it; a 400 or a full-needle match (none)
        # would fail this test.
        target_title = "x" * 100 + " and more"
        Board.objects.create(owner=self.user, title=target_title)
        self.assertEqual(self.results_for("y" * 150), [])
        self.assertEqual(self.results_for("x" * 150), [target_title])


class TestSoftDelete(APITestCase):
    def setUp(self):
        self.user, self.other_user = make_users()
        self.board = Board.objects.create(owner=self.user, title="Doomed")
        self.kept = Board.objects.create(owner=self.user, title="Kept")

    def test_delete_returns_204_and_soft_deletes(self) -> None:
        response = self.client.delete(board_url(self.board))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Subsequent reads treat it as nonexistent.
        self.assertEqual(
            self.client.get(board_url(self.board)).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        titles = [
            b["title"] for b in self.client.get("/api/v1/boards/").data["results"]
        ]
        self.assertNotIn("Doomed", titles)

        # ...but the row still exists, with deleted_at set (undo later).
        self.board.refresh_from_db()
        self.assertIsNotNone(self.board.deleted_at)
        self.assertLess(
            timezone.now() - self.board.deleted_at, datetime.timedelta(seconds=5)
        )

    def test_patch_on_a_soft_deleted_board_is_404(self) -> None:
        # Soft delete must also take the row out of PATCH's object lookup:
        # a deleted board is simply not there anymore (D-021).
        self.client.delete(board_url(self.board))
        response = self.client.patch(
            board_url(self.board), {"title": "Zombie"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.board.refresh_from_db()
        self.assertEqual(self.board.title, "Doomed")

    def test_delete_on_a_soft_deleted_board_is_404(self) -> None:
        self.client.delete(board_url(self.board))
        response = self.client.delete(board_url(self.board))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestPagination(APITestCase):
    def setUp(self):
        self.user, self.other_user = make_users()
        for i in range(21):
            Board.objects.create(owner=self.user, title=f"Board {i:02d}")

    def test_page_size_20_with_next_link(self) -> None:
        first = self.client.get("/api/v1/boards/")
        self.assertEqual(first.data["count"], 21)
        self.assertEqual(len(first.data["results"]), 20)
        self.assertIsNotNone(first.data["next"])

        second = self.client.get("/api/v1/boards/", {"page": 2})
        self.assertEqual(len(second.data["results"]), 1)
        self.assertIsNone(second.data["next"])
