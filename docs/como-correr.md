# Cómo correr el proyecto

**Estado:** Implementado y verificado  
**Última actualización:** 2026-10-29

## Requisitos

- **Docker** 24 o superior.
- **Docker Compose** v2.


## Inicio rápido

```bash
git clone https://github.com/No-Country-simulation/S10-26-Team-12.git
cd S10-26-Team-12

# Opcional: personalizar credenciales o puertos
cp .env.example .env

docker compose up --build
```

Servicios disponibles:

| Servicio | URL / puerto | Descripción |
|---|---|---|
| Frontend | http://localhost:5173 | React + Vite (modo desarrollo) |
| Backend | http://localhost:5000 | API Express |
| Health check | http://localhost:5000/api/health | Estado de la API y PostgreSQL |
| PostgreSQL | `localhost:5432` | Base `repusense_db` |

Para correr en segundo plano:

```bash
docker compose up --build -d
docker compose ps
```

## Verificar que todo funciona

```bash
curl http://localhost:5000/api/health
```

Respuesta esperada:

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

Si PostgreSQL no responde, el endpoint devuelve **HTTP 503** con `"status": "error"` y
`"database": { "status": "down" }`. Esto evita falsos positivos: el health check no solo verifica que Express esté vivo, también consulta la base.

También se puede abrir el frontend en http://localhost:5173: muestra el estado de la
API y de la base de datos, con un botón para volver a verificar.

## Variables de entorno

Todas tienen valores por defecto para desarrollo. Copiar `.env.example` a `.env`
solo si se quieren cambiar.

| Variable | Default | Usada por |
|---|---|---|
| `DB_USER` | `postgres` | PostgreSQL / backend |
| `DB_PASSWORD` | `postgres` | PostgreSQL / backend |
| `DB_NAME` | `repusense_db` | PostgreSQL / backend |
| `PORT` | `5000` | Backend (el compose lo fija en 5000) |
| `NODE_ENV` | `development` | Backend |
| `JWT_SECRET` | `secretkey` | Backend (pendiente de uso real) |
| `VITE_API_URL` | `http://localhost:5000` | Frontend (navegador) |
| `AI_API_KEY` | vacío | Pendiente de proveedor de IA |

> Los valores por defecto son **solo para desarrollo local**. No usar estas
> credenciales en producción.

## Base de datos y migraciones

La base se entrega **limpia**: sin tablas ni datos. El esquema se implementa con
migraciones versionadas en `database/migrations/`, administradas por `node-pg-migrate`.
Ver [`database/README.md`](../database/README.md) para el flujo completo.

El servicio `migrate` aplica las pendientes en cada `docker compose up`.

Crear una migración:

```bash
docker compose run --rm migrate npm run migrate:create -- nombre
```

Gestionarlas (después de editar el `.sql` generado):

```bash
docker compose run --rm migrate npm run migrate:up
docker compose run --rm migrate npm run migrate:down
docker compose run --rm migrate npm run migrate:redo
docker compose run --rm migrate npm run migrate:status
```

`docker compose run` crea un contenedor temporal y `--rm` lo elimina al terminar; sin
`--rm` los contenedores detenidos se acumulan.

Con el repositorio recién clonado y sin migraciones de negocio, verificar que la base
esté vacía:

```bash
docker compose exec db psql -U postgres -d repusense_db -c '\dt'
```

Debería responder `Did not find any relations.`

## Comandos útiles

```bash
# Ver logs
docker compose logs -f
docker compose logs -f backend

# Entrar a PostgreSQL
docker compose exec db psql -U postgres -d repusense_db

# Ejecutar tests del backend dentro del contenedor
docker compose exec backend npm test

# Detener sin borrar datos
docker compose down

# Reset completo: borra el volumen y vuelve a una base limpia
docker compose down -v
docker compose up --build
```

## Tests

```bash
# Backend (necesita PostgreSQL accesible)
cd backend
npm test

# Frontend
cd frontend
npm run lint
npm run build
```

## Solución de problemas

| Problema | Causa probable | Solución |
|---|---|---|
| `port is already allocated` | Otro proceso usa 5000, 5173 o 5432 | Detener el proceso o cambiar el puerto en `.env` / compose |
| Health devuelve 503 | PostgreSQL todavía no está listo o falló | `docker compose logs db` y esperar el healthcheck |
| El frontend no refleja cambios | Caché del navegador | Recargar con `Ctrl+Shift+R` |
| Cambié dependencias y falla | La imagen no tiene los nuevos paquetes | `docker compose up --build` |
| Quiero empezar de cero | El volumen conserva datos | `docker compose down -v` |
| `permission denied` al usar Docker | El usuario no está en el grupo `docker` | Usar `sudo` o agregar el usuario al grupo |

## Notas

- El compose está pensado para **desarrollo** (Vite dev server, nodemon, bind mounts).
  Antes de un despliegue productivo hay que definir build de frontend, usuario no-root,
  secretos reales y un reverse proxy.
- El puerto de PostgreSQL se publica solo en `127.0.0.1`.
- El servicio `migrate` monta `database/` con escritura para poder crear archivos;
  `backend` lo monta en solo lectura.
