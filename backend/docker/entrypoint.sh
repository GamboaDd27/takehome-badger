#!/usr/bin/env bash
set -e

# Wait for Postgres
echo "Waiting for Postgres at $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "Postgres is up."

# Wait for Redis
echo "Waiting for Redis at ${CELERY_BROKER_URL}..."
# simple ping (best-effort)
python - <<'PY'
import os, time
import redis
url = os.environ.get("CELERY_BROKER_URL", "redis://redis:6379/0")
r = redis.from_url(url)
for _ in range(60):
    try:
        if r.ping():
            print("Redis is up.")
            break
    except Exception:
        time.sleep(1)
else:
    raise SystemExit("Redis not reachable")
PY

# Django setup
python manage.py migrate --noinput

# Create media dir
mkdir -p media/csv_uploads

# Run dev server (bind 0.0.0.0:8000 per requirement)
python manage.py runserver 0.0.0.0:8000
# For prod-like:
# gunicorn config.wsgi:application -b 0.0.0.0:8000 --workers 3
