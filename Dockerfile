# syntax=docker/dockerfile:1
#
# Self-contained production image for the Next.js app.
#
# NOTE: the primary deploy target is Cloudflare Pages (see .github/workflows/
# deploy.yml). This image is for local/self-hosted runs.
#
# NEXT_PUBLIC_* values are inlined into the client bundle by `next build`, so
# they must be supplied as BUILD args — passing them only at `docker run` time
# leaves the browser with `undefined` and a dead Supabase client.
#
#   docker build \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
#     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
#     --build-arg NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=... \
#     --build-arg NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=... \
#     -t talents-platform .
#
# SUPABASE_SERVICE_ROLE_KEY is server-only and must be passed at RUN time, never
# as a build arg — build args are recorded in the image history.

ARG NODE_VERSION=22

# ── deps: full dependency tree (build needs typescript/tailwind from devDeps) ─
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ── builder ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /usr/src/app

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
ARG NEXT_PUBLIC_CLOUDINARY_FOLDER=talents
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME \
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=$NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET \
    NEXT_PUBLIC_CLOUDINARY_FOLDER=$NEXT_PUBLIC_CLOUDINARY_FOLDER \
    NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── runner ───────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

COPY --from=builder /usr/src/app/.next        ./.next
COPY --from=builder /usr/src/app/public       ./public
COPY --from=builder /usr/src/app/next.config.ts ./next.config.ts

USER node
EXPOSE 3000
CMD ["npm", "start"]
