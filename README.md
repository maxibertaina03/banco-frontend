
# Banco Frontend Unificado

Frontend React con Vite para el backend bancario en `C:\Users\Usuario\Desktop\BANCO\banco-backend`.

## Que incluye

- Una sola aplicacion para `cliente`, `operador` y `admin`
- Vistas habilitadas por rol usando los datos reales de `personas_roles`
- Integracion con CRUD de personas, usuarios, cuentas y destinatarios
- Operaciones bancarias conectadas a `POST /api/transacciones/operar`

## Ejecutar

1. Instala dependencias con `npm install`
2. Levanta el backend en `http://localhost:3001`
3. Ejecuta `npm run dev`

El proxy de Vite ya apunta `/api` a `http://localhost:3001`.
  
