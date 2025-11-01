# Dockerfile
FROM node:18-slim

# Install required OS packages (openssl for Prisma, netcat for wait helper)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl netcat-openbsd \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package manifests and install production deps
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Ensure entrypoint is executable
RUN chmod +x /usr/src/app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
CMD ["node", "index.js"]