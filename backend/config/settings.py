"""Django settings for the OHh backend.

Single settings module (D-008: native Windows dev, no settings split).
Values are read from the process environment, falling back to the .env file
at the REPO ROOT (so Docker Compose and local tooling share one file).
"""

from pathlib import Path

import environ

# BASE_DIR is the repo root: config/ -> backend/ -> <repo root>.
# The .env lives there because docker-compose.yml needs the same variables.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
env_file = BASE_DIR / ".env"
if env_file.exists():
    environ.Env.read_env(env_file)

# Required with no default ON PURPOSE: an empty secret must fail loudly,
# never silently weaken sessions/CSRF. Same key is used in every environment.
SECRET_KEY = env("DJANGO_SECRET_KEY")

DEBUG = env.bool("DJANGO_DEBUG", default=False)

ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "apps.accounts",
    "apps.core",
    "apps.boards",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # CorsMiddleware must run before CommonMiddleware to add CORS headers
    # on preflight responses (docs/ARCHITECTURE.md: API-first frontend).
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB", default="ohh"),
        "USER": env("POSTGRES_USER", default="ohh"),
        "PASSWORD": env("POSTGRES_PASSWORD", default=""),
        # WHY 127.0.0.1, not localhost (D-024): on Windows, localhost may
        # resolve to IPv6 ::1 first while Postgres here listens on IPv4 only,
        # adding multi-second connection delays.
        "HOST": env("POSTGRES_HOST", default="127.0.0.1"),
        "PORT": env.int("POSTGRES_PORT", default=5433),
        # WHY: on Windows, libpq's non-blocking connect treats ECONNREFUSED as
        # "still connecting" and psycopg waits indefinitely (observed with
        # psycopg 3.3.7): makemigrations silently hung with the DB offline.
        # A short timeout turns that into a clear OperationalError.
        "OPTIONS": {"connect_timeout": 3},
    }
}

# Custom user model must be declared before the first migration runs
# (D-006), otherwise swapping it later means data migrations pain.
AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    # auth arrives in Phase 8 (ARCHITECTURE.md): SimpleJWT + get_current_user().
    # Until then there are no authentication classes; endpoints are public
    # behind AllowAny and MUST NOT handle any real user data yet.
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
