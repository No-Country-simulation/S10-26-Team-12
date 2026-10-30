# Migraciones

Cada archivo `.sql` de esta carpeta es una migración versionada administrada por
`node-pg-migrate`. El nombre incluye un timestamp que define el orden:

```
1793222542862_crear-tabla-negocios.sql
```

## Crear una migración

Desde la raíz del repositorio:

```bash
docker compose run --rm migrate npm run migrate:create -- crear_tabla_negocios
```

El archivo generado se completa con las dos secciones obligatorias:

```sql
-- Up Migration
CREATE TABLE negocios (
    id bigserial PRIMARY KEY,
    nombre text NOT NULL,
    creado_en timestamptz NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE negocios;
```

## Reglas

- Completar **siempre** `Up` y `Down`. El `Down` debe dejar la base como estaba.
- No modificar migraciones ya aplicadas en entornos compartidos: crear una nueva.
- Un archivo = un cambio lógico y revisable.
- Solo se ejecutan archivos `.sql`. El resto (como este README o `.gitkeep`) se
  ignora.
- La tabla `pgmigrations` es el historial y no debe editarse a mano.

## Comandos relacionados

Todos los comandos se ejecutan con Docker Compose; `npm run ...` es el script que
corre dentro del contenedor, no en el host:

```bash
docker compose run --rm migrate npm run migrate:create -- nombre
docker compose run --rm migrate npm run migrate:up
docker compose run --rm migrate npm run migrate:status
docker compose run --rm migrate npm run migrate:down
docker compose run --rm migrate npm run migrate:redo
```

`docker compose run` crea un contenedor temporal y `--rm` lo elimina al terminar, así
no quedan contenedores detenidos acumulándose.

Ver [`database/README.md`](../README.md) para el flujo completo, el uso con Docker y
la solución de problemas.

> Esta carpeta se entrega sin migraciones de negocio. La base queda limpia hasta
> que el equipo defina el esquema.
