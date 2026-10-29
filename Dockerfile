# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# NEXT_PUBLIC_* values are baked into the browser bundle at build time
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_META_PIXEL_ID
ARG NEXT_PUBLIC_WHATSAPP
ARG NEXT_PUBLIC_LINE_URL
ARG NEXT_PUBLIC_CONTACT_EMAIL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build \
 # photos are copied straight from the source into their own cached layers of the run image (below)
 && rm -rf public/boats public/img

# ---------- run ----------
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
# boat + site photos (~150 MB) in layers of their own: a deploy re-downloads them only when a photo changes
COPY public/img ./public/img
COPY public/boats ./public/boats
COPY --from=build /app/.next ./.next
COPY next.config.mjs tsconfig.json ./
COPY --from=build /app/public ./public
COPY site ./site
COPY drizzle ./drizzle
COPY scripts ./scripts
COPY data ./data
COPY src/db ./src/db
COPY src/lib/crypto.ts ./src/lib/crypto.ts
# images uploaded from /admin (a volume in docker-compose.yml, so they survive rebuilds)
RUN mkdir -p /app/uploads && chown node:node /app/uploads \
 # files are read by the node user whatever their mode on the build machine
 && chmod -R a+rX /app/site /app/data /app/drizzle /app/scripts \
 && find /app/public -mindepth 1 -maxdepth 1 ! -name img ! -name boats -exec chmod -R a+rX {} +
# what is running, shown in /admin → ตั้งค่า → ระบบ (passed by the deploy; last, so they never bust the build cache)
ARG APP_COMMIT=""
ARG APP_COMMIT_TIME=""
ARG APP_COMMIT_MSG=""
ARG APP_BUILD_TIME=""
ENV APP_COMMIT=$APP_COMMIT APP_COMMIT_TIME=$APP_COMMIT_TIME APP_COMMIT_MSG=$APP_COMMIT_MSG APP_BUILD_TIME=$APP_BUILD_TIME
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
# apply pending migrations, then start
CMD ["sh", "-c", "npx tsx scripts/migrate.ts && npx next start -p 3000"]
