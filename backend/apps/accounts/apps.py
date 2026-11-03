from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"
    # Label keeps settings concise: AUTH_USER_MODEL = "accounts.User".
    label = "accounts"
