# Frontend Next.js (solo UI). Contexto de build: este repo.
# Node 22: pnpm 11 requiere Node >= 22.13 (usa el builtin node:sqlite).
FROM node:22-alpine AS build
# pnpm fijado a la versión que generó el lockfile (build reproducible).
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app

# Deps (capa cacheable)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# NEXT_PUBLIC_* se inlinea en el build → debe ser la URL PÚBLICA del API (la que ve el navegador).
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000
# next start respeta el PORT que inyecta el host (Railway).
CMD ["pnpm", "start"]
