FROM node:18-slim

# Install required OS packages (openssl for Prisma, netcat for wait helper, bash)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl netcat-openbsd bash \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package manifests and install all deps (needed so prisma, prisma CLI, and seed scripts are available at runtime)
COPY package*.json ./
# Install full set of dependencies so we can run `npx prisma` and seeding during container startup
RUN npm ci

# Copy app source
COPY . .

# Ensure entrypoint is executable
RUN chmod +x /usr/src/app/entrypoint.sh

EXPOSE 3000

# Dev-friendly defaults: run migrations and seed automatically.
# WARNING: These defaults are convenient for local development only.
# Remove or override these ENV in production (e.g., set RUN_SEED=false and FORCE_DB_PUSH=false).
ENV NODE_ENV=development
ENV RUN_SEED=true
ENV MIGRATE_MODE=deploy
ENV FORCE_DB_PUSH=true

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]