FROM node:20-alpine
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

RUN pnpm prune --prod

EXPOSE 1234
CMD ["node", "dist/server.js"]
