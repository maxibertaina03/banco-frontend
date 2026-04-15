# banco-frontend

Frontend estático del panel bancario, separado del backend para publicarse como repositorio independiente.

## Contenido

- `index.html`: estructura del dashboard
- `styles.css`: estilos del panel
- `app.js`: consumo de la API y render dinámico

## Configuración de API

Por defecto el frontend consulta:

```text
http://localhost:3000
```

Si querés apuntarlo a otro backend, definí `window.BANCO_API_URL` antes de cargar `app.js`.

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
