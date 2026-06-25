# Sistema de Pedidos — Frontend (UI)

UI del sistema de pedidos por QR: **Next.js 14 (App Router) + Tailwind**. Solo presentación;
consume el backend por HTTP vía `NEXT_PUBLIC_API_URL`. Incluye la PWA del cliente
(`/m/[mesaId]`) y las pantallas de staff (login, mozo, KDS, caja, admin). Staff con
`AuthProvider` (JWT en localStorage). Las pantallas refrescan por polling.

## Desarrollo local

```bash
cp .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:4000
pnpm install
pnpm dev                          # http://localhost:3000 (requiere el backend en :4000)
```

## Scripts

| Script       | Qué hace                              |
| ------------ | ------------------------------------- |
| `pnpm dev`   | Next en desarrollo (puerto 3000)      |
| `pnpm build` | build de producción                   |
| `pnpm start` | sirve el build (usa el `PORT` del host) |
| `pnpm lint`  | ESLint                                |

## Variables de entorno

`NEXT_PUBLIC_API_URL` — URL **pública** del backend. Se **incrusta en el build** (las
`NEXT_PUBLIC_*` se inlinean), así que debe estar definida antes de compilar.

## Despliegue (Railway)

Servicio con Dockerfile. Pasa `NEXT_PUBLIC_API_URL` como variable del servicio (Railway la
inyecta como build ARG); debe apuntar al dominio público del backend. El backend, a su vez,
debe tener `FRONTEND_ORIGIN` con el dominio de este front (CORS).
