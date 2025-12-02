#!/usr/bin/env sh
set -e

echo "Running: npx prisma generate"
npx prisma generate

# Wait for database
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
[ "$i" -lt "$max" ] && echo "\nok" || echo "\nTimeout, continuing..."

echo "Applying schema changes safely (migrate if possible, push if not)"
npx prisma migrate deploy || npx prisma db push

echo "Running seed script (idempotent — safe to run every time)"
node prisma/seed.js || echo "Seed failed (continuing anyway)"

echo "Starting Node.js app..."
exec "$@"