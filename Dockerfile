FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN --mount=type=cache,target=/var/cache/apk for i in 1 2 3 4 5; do apk add --no-cache libc6-compat && break || sleep 5; done

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Production dependencies only (smaller runtime image)
FROM base AS deps-prod
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# Generate favicon.ico from the same icon used in the UI (sidebar)
# This avoids browsers preferring the old .ico (often cached) over SVG icons.
FROM base AS icons
WORKDIR /app
COPY src/app/icon.svg ./src/app/icon.svg
RUN --mount=type=cache,target=/var/cache/apk for i in 1 2 3 4 5; do apk add --no-cache rsvg-convert imagemagick && break || sleep 5; done
RUN rsvg-convert -w 256 -h 256 src/app/icon.svg -o /tmp/icon.png \
	&& convert /tmp/icon.png -define icon:auto-resize=16,32,48,64,128,256 src/app/favicon.ico

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

# Generate Prisma Client
RUN npx prisma generate

COPY . .
COPY --from=icons /app/src/app/favicon.ico ./src/app/favicon.ico

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Add dummy DATABASE_URL for build time validation
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN --mount=type=cache,target=/app/.next/cache npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and config for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Copy production node_modules for migration script (bcryptjs, @prisma/client, pg dependencies)
# These aren't included in standalone build but needed for migrations
COPY --from=deps-prod --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy migration script and entrypoint
COPY --from=builder --chown=nextjs:nodejs /app/migrate.js ./migrate.js
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Make entrypoint script executable
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
