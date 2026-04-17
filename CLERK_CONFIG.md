# 🔧 Configuración Requerida en Clerk Dashboard

El error **"JSON.parse: unexpected character"** ocurre porque **Clerk no está autorizado a conectarse desde tu localhost**.

## Paso 1: Ir a Clerk Dashboard

1. Accede a: https://dashboard.clerk.com
2. Selecciona tu aplicación "Development" o "Orbital"
3. Click en **"Configure"** (en el top)

## Paso 2: Configurar Application URLs

En el menú izquierdo, busca **"Application URLs"** o **"Settings"**

Agrega estas URLs:

```
Allowed Sign In/Up Redirects:
- http://localhost:3000
- http://localhost:3000/auth/sign-in
- http://localhost:3000/auth/sign-up
- http://localhost:3000/dashboard
```

## Paso 3: Configurar CORS / Authorized Origins

En **"Settings"** o **"API Keys"**, busca **"Authorized Origins"**

Agrega:
```
http://localhost:3000
http://localhost:3000:3000
localhost:3000
```

## Paso 4: Verificar las Keys

1. Ve a **"API Keys"** (en el menú Developers)
2. Copia el **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** (comienza con `pk_`)
3. Copia el **CLERK_SECRET_KEY** (comienza con `sk_`)
4. Verifica que estén en `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... ← REEMPLAZA AQUÍ
CLERK_SECRET_KEY=sk_test_... ← REEMPLAZA AQUÍ
```

## Paso 5: Restart Frontend

Una vez configurado:

```bash
cd banco-frontend
# Presiona Ctrl+C si estaba corriendo
npm run dev
```

---

## ✅ Checklist

- [ ] Aplicación creada en Clerk
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY en .env.local
- [ ] CLERK_SECRET_KEY en .env.local
- [ ] http://localhost:3000 agregado en Authorized Origins
- [ ] Redirect URLs configuradas
- [ ] Frontend reiniciado (npm run dev)

Si el error persiste, revisa la consola del navegador (F12) para ver el error exacto de Clerk.

---

**Después de hacer estos cambios, el login debería funcionar correctamente.**
