# ── Stage 1: Build Angular frontend ─────────────────────────────────────────
FROM node:24-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY apps/frontend/ ./apps/frontend/
COPY libs/ ./libs/
COPY tsconfig.base.json ./

WORKDIR /app/apps/frontend
RUN npx ng build --configuration=production

# ── Stage 2: Build NestJS backend and serve Angular ──────────────────────────
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY apps/backend/ ./apps/backend/
COPY libs/ ./libs/
COPY tsconfig.base.json ./

# Copy Angular production build into backend's public directory
# ServeStaticModule will serve these files at the root path
COPY --from=frontend-builder /app/apps/frontend/dist/campusexchange/browser ./apps/backend/public

ENV PATH="/app/node_modules/.bin:${PATH}"

WORKDIR /app/apps/backend

# Compile NestJS TypeScript sources
RUN nest build

EXPOSE 3000

CMD ["node", "dist/main.js"]
