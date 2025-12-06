#!/usr/bin/env sh
set -e

echo "Running: npx prisma generate"
npx prisma generate

# Wait for database (uses DATABASE_URL or DB_HOST/DB_PORT env)
DB_HOST="${DB_HOST:-$(echo "$DATABASE_URL" | sed -n 's|.*@\(.*\):.*|\1|p')}"
DB_PORT="${DB_PORT:-3306}"

max=30
i=0
echo "Waiting for ${DB_HOST}:${DB_PORT} (timeout ${max}s)..."
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null || [ "$i" -ge "$max" ]; do
  i=$((i + 1))
  printf '.'
  sleep 1
done
if [ "$i" -lt "$max" ]; then
  echo "\nok"
else
  echo "\nTimeout waiting for DB — continuing (migrate may fail)"
fi

echo "Applying schema changes safely"
# MIGRATE_MODE: 'deploy' (default for containers) or 'push' for dev
MIGRATE_MODE="${MIGRATE_MODE:-deploy}"
FORCE_DB_PUSH="${FORCE_DB_PUSH:-false}"

if [ "$MIGRATE_MODE" = "deploy" ]; then
  if npx prisma migrate deploy; then
    echo "migrations deployed"
  else
    echo "migrate deploy failed"
    if [ "$FORCE_DB_PUSH" = "true" ]; then
      echo "FORCE_DB_PUSH=true, running prisma db push --accept-data-loss"
      npx prisma db push --accept-data-loss
    else
      echo "Not allowed to push DB schema automatically. Exiting with failure."
      exit 1
    fi
  fi
else
  echo "MIGRATE_MODE is not 'deploy', running prisma db push"
  if [ "$FORCE_DB_PUSH" = "true" ]; then
    npx prisma db push --accept-data-loss
  else
    npx prisma db push
  fi
fi

# Seed only if explicitly requested (safer for containerized environments)
if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "RUN_SEED=true: running seed script (idempotent)"
  # run seed but don't crash container if it fails (log and continue)
  if node prisma/seed.js; then
    echo "Seed completed"
  else
    echo "Seed failed, continuing startup (inspect logs)"
  fi
else
  echo "Skipping seed (set RUN_SEED=true to enable)"
fi

echo "Starting Node.js app..."
exec "$@"