# Configuración Clerk - Frontend

## Estado validado

El flujo que quedó funcionando es:
- sign in con `username + password`
- usuarios ya migrados a Clerk
- dashboard accesible desde el frontend

## Variables de entorno

Archivo `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Configuración de Clerk Dashboard

### Application URLs

Usar:

```text
http://localhost:3000
http://localhost:3000/auth/sign-in
http://localhost:3000/auth/sign-up
http://localhost:3000/dashboard
```

### Authentication strategy usada

En `User & authentication`:

- `Username`
  - `Sign-up with username`: ON
  - `Sign-in with username`: ON
- `Password`: ON
- `Email`: OFF para la UI si no se quiere usar en login
- `Phone`: OFF

En `SSO connections`:

- `Google`: OFF

## Resultado esperado

La UI de login debe pedir:
1. `username`
2. `password`

No debería mostrar:
- Google
- email
- phone

## Si el dashboard muestra error en la API

Revisar:
- backend levantado en `http://localhost:3001`
- frontend levantado en `http://localhost:3000`
- `NEXT_PUBLIC_API_URL` apuntando al backend correcto

## Checklist

- [ ] Clerk configurado con `username + password`
- [ ] Google desactivado
- [ ] `.env.local` completo
- [ ] backend corriendo en `3001`
- [ ] frontend corriendo en `3000`
