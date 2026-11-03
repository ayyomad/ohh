"""Tests for the custom user model and the initial migration."""

from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db.migrations.loader import MigrationLoader
from django.test import TestCase


class TestAuthUserModel(TestCase):
    def test_settings_declare_the_custom_user(self) -> None:
        from django.conf import settings

        self.assertEqual(settings.AUTH_USER_MODEL, "accounts.User")

    def test_get_user_model_returns_the_custom_user(self) -> None:
        self.assertEqual(
            get_user_model().__module__, "apps.accounts.models"
        )

    def test_creating_a_user_stores_a_hashed_password(self) -> None:
        user_model = get_user_model()
        user = user_model.objects.create_user(
            username="ohh-dev", password="s3cret-pass-word"
        )
        # The plaintext must never be persisted; check_password proves the
        # stored value validates through Django's hasher pipeline.
        self.assertNotEqual(user.password, "s3cret-pass-word")
        self.assertTrue(user.password.startswith("pbkdf2_"))
        self.assertTrue(user.check_password("s3cret-pass-word"))


class TestInitialAccountsMigration(TestCase):
    def test_initial_migration_depends_only_on_framework_migrations(self) -> None:
        # accounts.0001 must run BEFORE any other PROJECT migration (Phase 1
        # requirement). Its only dependencies are django.contrib.auth ones
        # (the documented pattern for a swapped user model created before
        # the first migrate); asserting "nothing but auth" is the honest check.
        loader = MigrationLoader(connection=None)
        migration = loader.get_migration_by_prefix("accounts", "0001")
        self.assertTrue(
            all(dep[0] == "auth" for dep in migration.dependencies),
            migration.dependencies,
        )

    def test_makemigrations_check_reports_no_missing_migrations(self) -> None:
        # The same gate CI runs; catching model drift early, in-test.
        out = StringIO()
        call_command("makemigrations", "--check", "--dry-run", stdout=out)
        self.assertIn("No changes detected", out.getvalue())
