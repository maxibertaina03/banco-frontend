# syntax=docker/dockerfile:1

# ── Compilación ───────────────────────────────────────────────────────────────
FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Todo lo que empieza con VITE_ se hornea en el bundle y queda a la vista de
# cualquiera que abra el navegador: acá sólo van datos públicos. La clave
# publicable de Clerk lo es por diseño; la secreta vive en el backend.
ARG VITE_CLERK_PUBLISHABLE_KEY
# Vacío a propósito: el cliente cae en "/api" relativo (lib/api/client.ts), así
# el portal y la API quedan en el mismo origen y no hay CORS en el navegador.
ARG VITE_API_BASE_URL=""
# En el servidor los pagos van contra el backend de verdad, no contra el mock.
ARG VITE_PAGOS_MOCK="false"

ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_PAGOS_MOCK=$VITE_PAGOS_MOCK

# Sin la clave de Clerk el portal compila igual y recién explota en el
# navegador, con la pantalla en blanco. Mejor fallar acá y no desplegar.
RUN test -n "$VITE_CLERK_PUBLISHABLE_KEY" || (echo "Falta VITE_CLERK_PUBLISHABLE_KEY" && exit 1)

RUN npm run build

# Dejar los archivos ya comprimidos al máximo, listos para servir.
#
# nginx comprime al vuelo en nivel 1 (rápido pero flojo) y lo rehace en cada
# request. Con gzip_static entrega estos .gz, comprimidos en nivel 9: pesan
# menos y el servidor no gasta CPU. En un droplet de 512 MB las dos cosas
# importan.
RUN find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.svg' \) \
      -exec gzip -9 -k {} \;


# ── Runtime ───────────────────────────────────────────────────────────────────
# Ya no hay Node: son archivos estáticos y los sirve nginx. La imagen final pesa
# unos 50 MB en vez de 400.
FROM nginx:alpine AS runtime

COPY nginx/spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=60s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/index.html || exit 1
