# Banco Orbital — Frontend

[![CI](https://github.com/maxibertaina03/banco-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/maxibertaina03/banco-frontend/actions/workflows/ci.yml)

Portal web del sistema de homebanking **Orbital**. SPA en React +
TypeScript con vistas habilitadas por rol (cliente, operador, admin,
tesorería, auditor) usando los datos reales del backend.

Forma parte del proyecto integrador de Práctica Profesionalizante I. El
backend vive en un repo separado: [banco-backend](https://github.com/maxibertaina03/banco-backend).

---

## 📚 Tabla de contenidos

- [Stack](#-stack)
- [Setup rápido](#-setup-rápido)
- [Variables de entorno](#-variables-de-entorno)
- [Scripts disponibles](#-scripts-disponibles)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Funcionalidades](#-funcionalidades)
- [Arquitectura y patrones](#-arquitectura-y-patrones)
- [Code splitting y performance](#-code-splitting-y-performance)
- [CI/CD](#-cicd)

---

## 🛠 Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | React 19 + TypeScript | Estándar moderno, ecosistema gigante |
| Build | Vite 6 | Dev server con HMR instantáneo, build con esbuild |
| Routing | react-router 7 | Estándar de SPA |
| Auth | @clerk/clerk-react | Componentes prefabricados de login/signup |
| Estado de servidor | @tanstack/react-query 5 | Caché declarativa, invalidación, devtools |
| Forms | react-hook-form + Zod | Validación type-safe, schemas compartidos con backend |
| UI | shadcn/ui + Tailwind | Componentes accesibles, copy-paste |
| Icons | lucide-react | Set consistente |

---

## 🚀 Setup rápido

```bash
# 1. Clonar
git clone https://github.com/maxibertaina03/banco-frontend.git
cd banco-frontend

# 2. Dependencias
npm ci

# 3. Variables de entorno
cp .env.example .env.local
# Editar .env.local

# 4. Levantar el backend en otro terminal (puerto 3001)

# 5. Dev server
npm run dev
```

Por defecto la app corre en `http://localhost:5173`. El proxy de Vite
está configurado para redirigir `/api` y `/auth` a `http://localhost:3001`
sin tocar nada de CORS.

**Build de producción:**

```bash
npm run build           # genera dist/
npm run preview         # sirve dist/ localmente para verificar
```

---

## 🔐 Variables de entorno

```bash
# API
VITE_API_BASE_URL=/api                        # default '/api' (usa el proxy de Vite)

# Auth (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...        # del dashboard de Clerk
```

> Las variables que empiezan con `VITE_` quedan **inlined en el bundle final** — no metas secretos ahí. Solo cosas que el cliente sí o sí necesita ver (publishable key de Clerk, URL del API).

---

## 📜 Scripts disponibles

| Script | Qué hace |
|---|---|
| `npm run dev` | Levanta el dev server con HMR en `localhost:5173` |
| `npm run build` | Compila a `dist/` (production) |
| `npm run preview` | Sirve el build para testing local |

---

## 📁 Estructura del proyecto

```
banco-frontend/
├── src/
│   ├── main.tsx                     # Entry point
│   ├── app/
│   │   ├── App.tsx
│   │   ├── providers.tsx            # Clerk + QueryClient + Router providers
│   │   └── router.tsx
│   ├── pages/
│   │   ├── PortalPage.tsx           # Página principal (orquesta secciones)
│   │   └── portal.config.ts         # Tabs por scope (cliente vs admin)
│   ├── components/                  # Componentes reutilizables (shadcn/ui + custom)
│   │   ├── ui/                      # Library shadcn (button, card, input, etc.)
│   │   ├── ErrorBoundary.tsx
│   │   ├── SectionLoader.tsx        # Fallback de Suspense
│   │   ├── ProtectedRoute.tsx
│   │   └── ...
│   ├── features/                    # Cada feature es independiente
│   │   ├── cuentas/
│   │   │   ├── api/                 # Llamadas HTTP
│   │   │   ├── types/
│   │   │   └── sections/AccountsSection.tsx
│   │   ├── transacciones/
│   │   │   ├── api/
│   │   │   └── sections/TransactionsSection.tsx
│   │   ├── personas/
│   │   │   └── sections/CompleteProfileSection.tsx
│   │   ├── destinatarios/
│   │   │   └── sections/RecipientsSection.tsx
│   │   ├── dashboard/
│   │   │   └── sections/DashboardSection.tsx
│   │   └── admin/
│   │       └── sections/AdminSection.tsx
│   ├── hooks/
│   │   ├── usePortalData.ts         # Datos del portal (queries declarativas)
│   │   ├── usePortalActions.ts      # Mutations (transferir, agregar destinatario, etc.)
│   │   └── usePortalForms.ts        # Forms residuales (createClient, alias)
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts            # fetch wrapper con auth + idempotency
│   │   ├── queries/                 # TanStack Query hooks por entidad
│   │   │   ├── keys.ts              # queryKeys centralizadas
│   │   │   ├── personas.ts
│   │   │   ├── transacciones.ts
│   │   │   ├── destinatarios.ts
│   │   │   └── catalogos.ts
│   │   ├── schemas/                 # Zod schemas (espejos del backend)
│   │   │   ├── recipient.ts
│   │   │   ├── transfer.ts
│   │   │   └── complete-profile.ts
│   │   ├── queryClient.ts           # Configuración global de TanStack Query
│   │   ├── constants/
│   │   └── utils/
│   ├── styles/
│   └── vite-env.d.ts
├── public/
├── vite.config.ts                   # Proxy + manualChunks
└── .github/workflows/ci.yml         # CI: build + audit
```

---

## 🎯 Funcionalidades

### Para clientes

| Sección | Qué hace |
|---|---|
| **Completar perfil** | Si Clerk te creó pero faltan datos (DNI, fecha nac.), te lleva acá antes de operar |
| **Dashboard** | Saldo total + cuentas + últimos 8 movimientos |
| **Cuentas** | Detalle de cada cuenta (CBU, saldo, alias) + editar alias |
| **Transferir** | CBU/alias con lookup en Brocoly + autocomplete desde agenda + validación de saldo |
| **Destinatarios** | ABM de agenda de CBUs externos |

### Para admin / operador / tesorería

| Sección extra | Qué hace |
|---|---|
| **Admin** | Crear clientes desde admin + sincronizar cuentas con Brocoly |
| (vía backend) | Depósito en efectivo: `POST /api/transacciones/deposito` |

Los tabs visibles dependen del rol del usuario. Eso se calcula en
`features/personas/api/personas.api.ts` con `getRoleScope()`.

---

## 🏗 Arquitectura y patrones

### Capa de datos: TanStack Query

Todas las llamadas HTTP pasan por hooks de [src/lib/queries/](src/lib/queries/):

```ts
// Consulta declarativa con caché
const { data: profile, isLoading } = usePersonaFull(personaId);

// Mutation con invalidación automática
const transferMutation = useCreateTransfer(personaId);
await transferMutation.mutateAsync({ cbuOrigen, cbuDestino, importe, saldoOrigen, idempotencyKey });
// → onSuccess invalida usePersonaFull y usePersonaTransactions
// → la UI se refresca sola
```

**Defaults globales** (`src/lib/queryClient.ts`):
- `staleTime: 30s` — los datos quedan "frescos" 30 segundos
- `gcTime: 5min` — cache vive 5 minutos sin uso
- `refetchOnWindowFocus: true` — refresca al volver al tab
- `retry`: 1 reintento, pero **no** en 4xx (no tiene sentido reintentar auth)

### Forms: react-hook-form + Zod

Cada section maneja su form internamente:

```tsx
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(transferSchema),     // mismo Zod del backend
  mode: "onTouched",
});

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("cbuDestino")} />
  {errors.cbuDestino && <span>{errors.cbuDestino.message}</span>}
</form>
```

`onSubmit` recibe **datos ya validados** (no events crudos). El padre delega la lógica de mutation al hook compartido.

### Cliente HTTP unificado

[src/lib/api/client.ts](src/lib/api/client.ts) inyecta automáticamente:

- `Authorization: Bearer <JWT de Clerk>` (vía `setAccessTokenProvider`)
- `Content-Type: application/json`
- `Idempotency-Key: <UUID>` si el caller lo pide

Y normaliza errores:

```ts
try {
  await createTransfer(...);
} catch (err) {
  if (err instanceof ApiError) {
    if (err.status === 422) { /* saldo insuficiente */ }
    if (err.status === 429) { /* rate limit */ }
  }
}
```

### Idempotency desde el frontend

```ts
const idempotencyKey = crypto.randomUUID();
await transferMutation.mutateAsync({
  cbuOrigen, cbuDestino, importe, saldoOrigen,
  idempotencyKey,
});
```

Si el usuario hace doble-click (no debería, el botón se bloquea con
`disabled={submitting}`), el backend devuelve la respuesta cacheada sin
re-ejecutar la transferencia.

---

## ⚡ Code splitting y performance

### Lazy sections + vendor chunks

[vite.config.ts](vite.config.ts) declara `manualChunks` para separar el
bundle en piezas cacheables:

```js
manualChunks: {
  'react-vendor':  ['react', 'react-dom', 'react-router'],
  'clerk-vendor':  ['@clerk/clerk-react'],
  'query-vendor':  ['@tanstack/react-query', '@tanstack/react-query-devtools'],
  'form-vendor':   ['react-hook-form', '@hookform/resolvers', 'zod'],
}
```

Y `PortalPage.tsx` usa `React.lazy()` para cada section. **Resultado:**

| Chunk | Size | Gzip |
|---|---|---|
| `clerk-vendor` | 225 KB | 67 KB |
| `form-vendor` | 86 KB | 25 KB |
| `index entry` (app shell) | 65 KB | 22 KB |
| `query-vendor` | 48 KB | 15 KB |
| `react-vendor` | 36 KB | 13 KB |
| `AdminSection` (lazy) | 29 KB | 6 KB — **clientes no lo descargan** |
| Demás sections (lazy) | 4-9 KB c/u | 1-3 KB |

**Beneficios reales:**

1. **Cache granular**: un deploy con un fix de UI solo cambia `index.js` (22 KB gzip). Los vendors quedan cacheados desde el deploy anterior.
2. **AdminSection** (~6 KB gzip) **no se sirve a clientes** que no son admin.
3. **Carga paralela** de chunks vía HTTP/2.

---

## 🔄 CI/CD

GitHub Actions corre en cada push y PR. Ver [.github/workflows/ci.yml](.github/workflows/ci.yml).

| Job | Qué hace |
|---|---|
| `build` | `npm ci` + `npm run build` + verifica que `dist/` no esté vacío + upload artifact (7 días) |
| `security-audit` | `npm audit --audit-level=high` (informativo) |

---

## 📄 Documentación adicional

- [CHANGELOG.md](../CHANGELOG.md) — bitácora completa de decisiones arquitectónicas.
- README del backend con la lista de endpoints disponibles.
