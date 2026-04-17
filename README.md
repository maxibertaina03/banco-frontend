# Banco Frontend - Next.js + Clerk

Frontend moderno para la plataforma bancaria, construido con Next.js 14 y Clerk para autenticación.

## Características

- ✅ Autenticación con Clerk
- ✅ Pages App Router de Next.js
- ✅ TypeScript
- ✅ Tailwind CSS para estilos
- ✅ Fully responsive
- ✅ Integración con backend Express

## Estructura

```
banco-frontend/
├── app/
│   ├── layout.tsx           # Layout principal con ClerkProvider
│   ├── page.tsx             # Home page
│   ├── globals.css          # Estilos globales
│   ├── auth/
│   │   ├── layout.tsx       # Layout para páginas de auth
│   │   ├── sign-in/page.tsx # Página de login
│   │   └── sign-up/page.tsx # Página de registro
│   ├── dashboard/
│   │   └── page.tsx         # Dashboard del usuario (protegido)
│   └── api/
│       └── profile/route.ts # Endpoint para obtener perfil
├── public/                  # Archivos estáticos
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Instalación

```bash
cd banco-frontend
npm install
```

## Configuración de Clerk

Asegúrate de tener las siguientes variables de entorno en `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Desarrollo

```bash
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Build para Producción

```bash
npm run build
npm start
```

## Flujo de Autenticación

1. Usuario accede a home
2. Si no está autenticado, ve opciones de Login/Register
3. Completa autenticación con Clerk
4. Redirige a dashboard
5. Dashboard muestra datos del usuario e integración con backend


Ejemplo:

```html
<script>
  window.BANCO_API_URL = 'https://tu-backend.ejemplo.com';
</script>
<script src="./app.js"></script>
```

## Uso

Podés abrirlo con cualquier servidor estático. Por ejemplo:

```bash
python3 -m http.server 4173
```

Luego abrí:

```text
http://localhost:4173
```
