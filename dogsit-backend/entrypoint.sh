#!/usr/bin/env sh
set -e

echo "Running: npx prisma generate"
npx prisma generate

# Extract DB_HOST from DATABASE_URL if not set
DB_HOST="${DB_HOST:-$(echo "$DATABASE_URL" | sed -n 's|.*@\(.*\):.*|\1|p')}"
DB_PORT="${DB_PORT:-3306}"

# Wait for DB (max 30 seconds)
max=30
i=0
echo "Waiting for ${DB_HOST}:${DB_PORT} (timeout ${max}s)..."
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null || [ "$i" -ge "$max" ]; do
  i=$((i + 1))
  printf '.'
  sleep 1
done

if [ "$i" -ge "$max" ]; then
  echo "\nTimeout reached waiting for DB (${DB_HOST}:${DB_PORT}), continuing anyway..."
else
  echo "\nok"
fi

echo "Syncing schema to database (bypassing broken migrations)"
npx prisma db push --force-reset --skip-generate

echo "Running seed script"
node prisma/seed.js || echo "Seed script failed (continuing)"

echo "Starting Node.js app..."
exec "$@"