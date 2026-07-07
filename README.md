# Sistema de Pedidos — Frontend (UI)

UI del sistema de pedidos por QR para cafetería. Incluye la **landing** pública, la **PWA del
cliente** (pedir desde la mesa) y todo el **panel de staff** (mozo, cocina, caja y el panel del
dueño/admin). Solo presentación: consume el backend por HTTP vía `NEXT_PUBLIC_API_URL`.

Es el repo **frontend** de un sistema de **dos repos** (este + `sistema-pedidos-backend`).

## Stack

- **Next.js 14** (App Router) + **TypeScript**.
- **Tailwind CSS 3** + **lucide-react**. UI hecha a mano (sin shadcn/Radix).
- **AuthProvider** propio: JWT de staff en `localStorage`.
- Datos en vivo por **polling** (hook `usePoll`). `qrcode` para generar QR de mesas.

## Diseño

Estilo **moderno minimal**: tokens en `tailwind.config.ts` (`ink` negro de alto contraste,
`accent` ámbar puntual, fuente `display`), primitivas en `components/ui`
(`button`, `card`, `badge`, `spinner`). Restilar estas piezas propaga el cambio a todas las
pantallas.

## Páginas (rutas)

| Ruta | Quién | Contenido |
| --- | --- | --- |
| `/` | público | **Landing** (home de cafetería): hero, "cómo pedir", **menú en vivo** (`/api/menu`), visítanos, footer. |
| `/login` | staff | Ingreso (email + PIN/contraseña). |
| `/m/[mesaId]` | cliente | **PWA**: al escanear, la mesa se **reserva 5 min** (contador) y se entra al **pedido grupal** — varios comensales comparten un carrito y **todos aceptan** antes de enviar a cocina (el anfitrión puede quitar inactivos o forzar). Menú con modificadores/combos, "mis pedidos" por polling, llamar mozo / pedir cuenta, encuesta. |
| `/staff` | staff | Hub con accesos según rol. |
| `/mozo` | mozo/admin | Mesas (unir/separar), eventos, sesiones, pedido manual, entregar/cancelar. |
| `/kds` | barista/admin | Cola de cocina (tomar → listo) + marcar productos agotados. |
| `/caja` | cajero/admin | Cuentas por cobrar, detalle, **pagos divididos** (split) y cierre. |
| `/admin` | admin | **Panel del dueño** con sidebar (ver abajo). |

### Panel `/admin` (sidebar)

- **Negocio** — `Dashboard` (ingresos/egresos/**ganancia**/margen + cancelados),
  `Ventas` (detalle **venta por venta**, expandible), `Egresos`, `Ingresos` extra,
  `Presupuesto` mensual con alertas.
- **Operación** — `Catálogo` (CRUD productos/categorías + modificadores),
  `Menú del día` (promos + combos), `Mesas y QR`.
- **Personal** — `Personal` (CRUD staff, roles, remuneración), `Turnos` (agenda semanal),
  `Planilla` (cálculo → egreso automático).
- **Análisis** — `Reportes` (ventas, satisfacción, top productos, horas pico).

## Estructura

```
src/
├── app/
│   ├── page.tsx                 landing
│   ├── login/                   ingreso staff
│   ├── m/[mesaId]/              PWA del cliente (cliente-app, grupo-view, pedidos, encuesta)
│   └── (staff)/                 layout con nav por rol
│       ├── staff|mozo|kds|caja/
│       └── admin/               panel sidebar
│           ├── finanzas/        dashboard, ventas, egresos, ingresos, presupuesto
│           ├── menu-dia/        promos + combos del día
│           └── personal/        personal, turnos, planilla
├── components/{ui,menu,landing,…}
└── lib/{client-api, roles, money, price, use-poll, cn, …}
```

## Estado de funcionalidades

- ✅ Landing + PWA cliente + staff (mozo/KDS/caja) + admin (catálogo/mesas/reportes).
- ✅ **Pedido grupal con hold** en la PWA: reserva con contador, "¿eres del mismo grupo?",
  carrito compartido y aceptación de todos (controles del anfitrión).
- ✅ Panel del dueño completo — Fase A (finanzas), B (presupuestos), C (personal + turnos),
  D (planilla), E (menú del día/combos), más **Ventas** (detalle venta por venta).
- ⏳ Pendiente (opcional): rediseño minimal de mozo/KDS/caja y de la PWA del cliente
  (la landing/login/admin ya están en el estilo nuevo); `socket.io-client` para realtime.

## Desarrollo local

```bash
cp .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:4000
pnpm install
pnpm dev                          # http://localhost:3000 (requiere el backend en :4000)
```

Login demo: `admin@cafe.demo / admin123` (ve todas las pantallas).

## Scripts

| Script       | Qué hace                                |
| ------------ | --------------------------------------- |
| `pnpm dev`   | Next en desarrollo (puerto 3000)        |
| `pnpm build` | build de producción                     |
| `pnpm start` | sirve el build (usa el `PORT` del host) |
| `pnpm lint`  | ESLint                                  |

## Variables de entorno

`NEXT_PUBLIC_API_URL` — URL **pública** del backend. Se **incrusta en el build** (las
`NEXT_PUBLIC_*` se inlinean), así que debe estar definida antes de compilar.

## Despliegue (Railway)

Servicio con Dockerfile. Pasa `NEXT_PUBLIC_API_URL` como variable del servicio (Railway la
inyecta como build ARG); debe apuntar al dominio público del backend. El backend, a su vez,
debe tener `FRONTEND_ORIGIN` con el dominio de este front (CORS).
