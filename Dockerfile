# syntax=docker/dockerfile:1
# Multi-arch friendly (amd64 + arm64, e.g. Raspberry Pi 4/5). Debian base, not Alpine, so the
# prebuilt sharp and libsql native binaries (glibc) work without compiling anything.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    STORAGE_PATH=/app/data

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Migrations are read from disk at startup, so file tracing doesn't pick them up.
COPY --from=build --chown=node:node /app/drizzle ./drizzle
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/
RUN mkdir -p /app/data && chown node:node /app/data

# Starts as root only to fix the data folder's ownership; the server runs as `node`.
ENTRYPOINT ["docker-entrypoint.sh"]
EXPOSE 3000
VOLUME ["/app/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
