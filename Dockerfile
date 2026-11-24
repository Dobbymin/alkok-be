# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN mkdir -p /app/prisma /app/node_modules/.prisma && \
    if [ -f prisma/schema.prisma ]; then npx prisma generate; fi
RUN pnpm build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

RUN chown -R node:node /app
USER node

EXPOSE 8080
CMD ["node", "dist/main.js"]
