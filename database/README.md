# Base de datos

PostgreSQL 18 con un sistema de **migraciones versionadas**. La base se entrega
**limpia**: sin tablas de negocio ni datos. El próximo desarrollador define el
esquema agregando migraciones en `database/migrations/`.

## Cómo funciona

- Motor: **PostgreSQL 18** (`postgres:18-alpine`).
- Volumen persistente: `postgres_data`.
- Herramienta: [`node-pg-migrate`](https://salsita.github.io/node-pg-migrate/)
  (instalada en `backend`).
- Migraciones: archivos `.sql` en [`database/migrations/`](migrations/README.md).
- Historial: tabla `public.pgmigrations` (la crea la herramienta). **No** es una
  tabla de negocio: registra qué migraciones se aplicaron y cuándo.
- Al levantar el entorno, el servicio `migrate` aplica las migraciones pendientes
  **antes** de que arranque el backend.

El esquema solo cambia a través de migraciones. No hay scripts de inicialización
ocultos ni SQL ejecutado automáticamente por la imagen de PostgreSQL.

## Flujo de trabajo

Docker Compose es el único flujo soportado: no se ejecuta `npm` en el host. El mismo
servicio `migrate` se usa para crear y gestionar migraciones.

```bash
# 1. Crear una migración (genera el archivo con timestamp)
docker compose run --rm migrate npm run migrate:create -- crear_tabla_negocios

# 2. Editar database/migrations/<timestamp>_crear-tabla-negocios.sql
#    Completar las secciones Up y Down.

# 3. Aplicar las migraciones pendientes
docker compose run --rm migrate npm run migrate:up

# 4. Ver el estado
docker compose run --rm migrate npm run migrate:status
```

El contenedor `migrate` corre como el usuario `node` (uid 1000), por lo que los
archivos quedan a nombre del usuario local y se pueden editar sin `sudo`.

El comando `create` genera un archivo con los dos marcadores obligatorios, que se
completan a mano:

```sql
-- Up Migration

-- Down Migration
```

En `Up` va el cambio (`CREATE TABLE`, `ALTER TABLE`, etc.) y en `Down` el SQL que lo
revierte.

Reglas importantes:

- **Toda migración debe tener un `Down` real** que revierta el `Up`. Sin eso no se
  puede hacer rollback.
- No editar una migración ya aplicada en un entorno compartido: crear una nueva.
- Los nombres de archivo llevan timestamp y determinan el orden de ejecución.
- Usar SQL explícito; es más fácil de revisar y auditar.
- La carpeta debe contener migraciones `.sql`; otros archivos (README, `.gitkeep`)
  se ignoran automáticamente al ejecutar.

## Comandos

### Referencia rápida

Crear una migración:

```bash
docker compose run --rm migrate npm run migrate:create -- nombre
```

Gestionarlas:

```bash
docker compose run --rm migrate npm run migrate:up
docker compose run --rm migrate npm run migrate:down
docker compose run --rm migrate npm run migrate:redo
docker compose run --rm migrate npm run migrate:status
```

`docker compose run` crea un contenedor temporal para ejecutar el comando. `--rm`
hace que ese contenedor se elimine automáticamente al terminar; sin `--rm` quedarían
contenedores detenidos acumulándose. No afecta a los contenedores de `docker compose
up` (`db`, `backend`, `frontend`).

### Tabla de comandos

| Comando | Descripción |
|---|---|
| `docker compose run --rm migrate npm run migrate:create -- nombre` | Crea una migración nueva |
| `docker compose run --rm migrate npm run migrate:up` | Aplica todas las migraciones pendientes |
| `docker compose run --rm migrate npm run migrate:up -- 1` | Aplica una sola migración pendiente |
| `docker compose run --rm migrate npm run migrate:down` | Revierte la última migración aplicada |
| `docker compose run --rm migrate npm run migrate:down -- 2` | Revierte las dos últimas migraciones |
| `docker compose run --rm migrate npm run migrate:redo` | Revierte y vuelve a aplicar la última migración |
| `docker compose run --rm migrate npm run migrate:status` | Lista migraciones aplicadas, pendientes y faltantes |

El servicio `migrate` monta `./database` con escritura en `/database` y usa
`MIGRATIONS_DIR=/database/migrations`. El backend monta la misma carpeta en solo
lectura.

### Estados de `migrate:status`

| Estado | Significado |
|---|---|
| `applied` | La migración figura en `pgmigrations` y el archivo existe |
| `pending` | El archivo existe pero todavía no se aplicó |
| `missing` | Se aplicó una migración cuyo archivo ya no está en el repo |

`missing` suele indicar que se borró o renombró un archivo ya aplicado. No es un
error automático, pero hay que revisarlo antes de desplegar.

## Ejecución automática en Docker Compose

```bash
docker compose up --build
```

Orden de arranque:

1. `db` queda saludable.
2. `migrate` aplica las migraciones pendientes y termina.
3. `backend` arranca solo si `migrate` terminó con éxito.
4. `frontend` arranca después del backend.

Si una migración falla, `migrate` termina con error y el backend no arranca. Ver:

```bash
docker compose logs migrate
```

El servicio usa una **advisory lock** de PostgreSQL, por lo que dos procesos no
pueden aplicar migraciones al mismo tiempo: el segundo espera.

## Verificar el estado de la base

```bash
# Salud de la API y conexión a la base
curl http://localhost:5000/api/health

# Historial de migraciones
docker compose exec db psql -U postgres -d repusense_db \
  -c 'SELECT id, name, run_on FROM pgmigrations ORDER BY id;'

# Tablas existentes
docker compose exec db psql -U postgres -d repusense_db -c '\dt'
```

Con el repositorio recién clonado, después de `docker compose up` la única tabla
debería ser `pgmigrations`. Eso es correcto: la base de negocio sigue limpia.

## Reset completo

Borrar el volumen elimina todos los datos y el historial de migraciones:

```bash
docker compose down -v
docker compose up --build
```

Al volver a levantar, `migrate` crea `pgmigrations` y aplica todas las
migraciones desde cero. Usar solo en desarrollo o cuando se quiera reconstruir la
base.

## Variables de las migraciones

El wrapper arma la conexión con `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y
`DB_NAME`, que Docker Compose inyecta en los servicios `migrate` y `backend`. No se
configura ninguna conexión a la base desde el host.

Variables opcionales:

| Variable | Default | Descripción |
|---|---|---|
| `MIGRATIONS_DIR` | `database/migrations` (en Docker: `/database/migrations`) | Carpeta de migraciones |
| `MIGRATIONS_TABLE` | `pgmigrations` | Tabla de historial |
| `MIGRATION_VERBOSE` | `false` | Muestra el detalle de la herramienta |

## Solución de problemas

| Problema | Causa probable | Solución |
|---|---|---|
| `migrate` termina con error | SQL inválido o `Down` incompleto | `docker compose logs migrate`; corregir y reintentar |
| `relation already exists` | Se creó una tabla fuera de migraciones | Revisar el historial y alinear el esquema |
| `missing` en `migrate:status` | Se borró/renombró un archivo aplicado | Restaurar el archivo o crear una migración correctiva |
| `database ... does not exist` | `DB_NAME` incorrecto o la DB no arrancó | Revisar `.env` y `docker compose ps` |
| El backend no arranca por `migrate` | La migración falló | Corregir la migración; el backend espera a que termine bien |
