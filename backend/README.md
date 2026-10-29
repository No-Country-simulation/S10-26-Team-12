# Backend — RepuSense

API construida con **Node.js + Express 5** y **PostgreSQL** (`pg`).

## Estructura

```
src/
├── app.js                 # Configuración de Express y arranque del servidor
├── config/database.js     # Pool de PostgreSQL y checkConnection()
├── routes/
│   ├── index.js           # Router principal montado en /api
│   └── health.routes.js   # GET /api/health
├── controllers/           # Pendiente: controladores de negocio
├── services/              # Pendiente: lógica de negocio
├── repositories/          # Pendiente: acceso a datos
└── utils/                 # Pendiente: utilidades compartidas
scripts/
└── migrate.js             # Wrapper de node-pg-migrate (up/down/redo/status/create)
```

Las migraciones SQL viven en `../database/migrations/`, fuera de esta carpeta.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Verifica API + base de datos. `200` si todo responde, `503` si la DB no está disponible |

Respuesta esperada con todo operativo:

```json
{
  "status": "ok",
  "message": "Backend y base de datos funcionando correctamente",
  "timestamp": "2026-10-28T20:00:00.000Z",
  "uptimeSeconds": 12.5,
  "database": {
    "status": "up",
    "name": "repusense_db",
    "latencyMs": 3
  }
}
```

## Ejecución con Docker

Docker Compose es el único flujo soportado. No se ejecuta `npm` en el host.

```bash
# Desde la raíz del repositorio
docker compose up --build
docker compose logs -f backend
docker compose exec backend npm test
```

El backend lee las variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`,
`PORT` y `JWT_SECRET` desde el entorno definido en `docker-compose.yml` / `.env`. El
servidor corre con `npm run dev` (nodemon) dentro del contenedor y el código se monta
como volumen, por lo que los cambios se recargan sin reconstruir la imagen.

## Migraciones

La base se versiona con `node-pg-migrate` y archivos SQL en `../database/migrations/`.
Todos los comandos se ejecutan en contenedores:

```bash
# Crear un archivo .sql nuevo (el servicio migrate monta database/ con escritura)
docker compose run --rm migrate npm run migrate:create -- nombre_de_la_migracion

# Aplicar pendientes / ver estado / revertir
docker compose run --rm migrate npm run migrate:up
docker compose run --rm migrate npm run migrate:status
docker compose run --rm migrate npm run migrate:down
docker compose run --rm migrate npm run migrate:redo
```

`docker compose run` crea un contenedor temporal y `--rm` lo elimina al terminar; sin
`--rm` los contenedores detenidos se acumulan.

- El wrapper `scripts/migrate.js` arma la conexión desde `DB_*`; Compose inyecta esas
  variables en los servicios `migrate` y `backend`.
- `MIGRATIONS_DIR` permite cambiar la carpeta (en Docker: `/database/migrations`).
- `MIGRATIONS_TABLE` cambia la tabla de historial (default `pgmigrations`).
- `MIGRATION_VERBOSE=true` muestra el detalle de la herramienta.
- Cada `Up` debe tener un `Down` que lo revierta.

Guía completa: [`database/README.md`](../database/README.md).

## Tests

```bash
docker compose exec backend npm test
```

Los tests usan `node:test` y necesitan una base PostgreSQL accesible (la base puede estar vacía; solo se ejecuta `SELECT current_database()`).

## Convenciones

- `app.js` exporta la app de Express; solo abre el puerto si se ejecuta directamente. Esto permite testear sin levantar un servidor.
- Los errores de la API se responden en JSON con `{ status, message }`.
- No agregar lógica de negocio en `app.js`: usar `routes` → `controllers` → `services` → `repositories`.
