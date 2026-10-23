#!/usr/bin/env bash
set -o errexit

DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" python manage.py migrate --noinput
python manage.py seed_demo
exec gunicorn socialdistribution.wsgi:application --bind "0.0.0.0:${PORT:-8000}"
