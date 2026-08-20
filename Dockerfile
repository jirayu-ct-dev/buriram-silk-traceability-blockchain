# syntax=docker/dockerfile:1

# ---------- Builder: dependencies เต็มชุด + Prisma generate + Nuxt build ----------
FROM node:24-alpine AS builder
WORKDIR /app

RUN corepack enable

# คัดลอกเฉพาะ manifest ก่อนเพื่อให้ layer ของ node_modules ถูก cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec prisma generate && pnpm build

# ---------- Runner: production output เท่านั้น (ไม่มี devDependencies) ----------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000

COPY --from=builder --chown=node:node /app/.output ./.output

USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
