FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
COPY frontend/package.json ./
RUN pnpm install
COPY frontend/ .
RUN pnpm build


FROM node:22-alpine AS backend-builder
WORKDIR /app
# Build tools required for argon2 and bcrypt
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN pnpm build

RUN pnpm prune --prod


FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/dist ./dist
COPY backend/package.json ./

COPY --from=frontend-builder /frontend/dist ./public

RUN touch /app/.env
EXPOSE 1234
CMD ["node", "dist/server.js"]
