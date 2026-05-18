# ─── Stage 1: Build the Vue frontend ────────────────────────────────────────
FROM oven/bun:1-alpine AS frontend-builder

WORKDIR /app/front

# Install dependencies (leverage layer cache)
COPY front/package.json front/bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY front/ ./
RUN bun run build-only


# ─── Stage 2: Prepare the backend ────────────────────────────────────────────
FROM oven/bun:1-alpine AS backend-builder

WORKDIR /app/back

# Install production dependencies only
COPY back/package.json back/bun.lock ./
RUN bun install --frozen-lockfile --production


# ─── Stage 3: Final runtime image ────────────────────────────────────────────
FROM oven/bun:1-alpine

WORKDIR /app

# Copy backend source + production node_modules
COPY --from=backend-builder /app/back/node_modules ./node_modules
COPY back/src ./src
COPY back/tsconfig.json ./tsconfig.json

# Copy the compiled frontend into the static folder the backend serves
COPY --from=frontend-builder /app/front/dist ./static

# Non-root user provided by the base image
USER bun

ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
