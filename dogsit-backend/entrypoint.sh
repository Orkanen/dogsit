#!/usr/bin/env sh
set -e

echo "Running: npx prisma generate"
npx prisma generate

# Wait helper (simple nc wait or loop)
DB_HOST="${DB_HOST:-$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')}"
DB_PORT="${DB_PORT:-3306}"

# Wait for DB to be reachable (10s * 30 = 300s max)
max=30
i=0
echo "Waiting for ${DB_HOST}:${DB_PORT} (timeout s)..."
until nc -z "${DB_HOST:-host.docker.internal}" "${DB_PORT:-3306}" || [ "$i" -ge "$max" ]; do
  i=$((i+1))
  printf '.'
  sleep 1
done

if [ "$i" -ge "$max" ]; then
  echo "Timeout reached waiting for DB (${DB_HOST}:${DB_PORT}), continuing..."
else
  echo " ok"
fi

echo "Running: npx prisma migrate deploy"
npx prisma migrate deploy

echo "Running seed script"
node prisma/seed.js || echo "Seed script failed (continuing)"

# Start app
exec "$@"