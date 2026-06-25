# Frontend Next.js (solo UI). Contexto de build: este repo.
FROM node:20-alpine AS build
RUN corepack enable
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
