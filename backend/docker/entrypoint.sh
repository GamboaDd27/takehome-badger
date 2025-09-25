#!/usr/bin/env bash
set -e

# ---- Wait for Postgres
echo "Waiting for Postgres at $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "Postgres is up."

# ---- Wait for Redis (broker / channels layer)
echo "Waiting for Redis at ${CELERY_BROKER_URL}..."
python - <<'PY'
import os, time
import redis
url = os.environ.get("CELERY_BROKER_URL", "redis://redis:6379/0")
r = redis.from_url(url)
for _ in range(120):
    try:
        if r.ping():
            print("Redis is up.")
            break
    except Exception:
        time.sleep(1)
else:
    raise SystemExit("Redis not reachable")
PY

# ---- Django migrations
python manage.py migrate --noinput

# ---- Media dir
mkdir -p media/csv_uploads

# ---- Start ASGI server (Uvicorn) for Django + Channels
# IMPORTANT: use your real Django project module for the ASGI path below.
# Example paths:
#   config.asgi:application   (if your settings module is config/settings.py)
#   backend.asgi:application  (if your settings module is backend/settings.py)
uvicorn config.asgi:application --host 0.0.0.0 --port 8000 --reload
