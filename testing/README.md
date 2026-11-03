# Testing

El proyecto usa pruebas automáticas y verificaciones manuales del entorno Docker.

## Backend

Los tests se ejecutan dentro del contenedor, con el entorno ya levantado:

```bash
docker compose exec backend npm test
```

- Framework: `node:test` (incluido en Node.js, sin dependencias extra).
- Archivo: `backend/test/health.test.js`.
- Requiere PostgreSQL accesible; la base puede estar vacía porque el test solo
  ejecuta `SELECT current_database()`.
- No se ejecuta `npm` en el host.

## Migraciones

El servicio `migrate` aplica las migraciones automáticamente en cada
`docker compose up`. Para ejecutar comandos puntuales:

```bash
docker compose run --rm migrate npm run migrate:up
docker compose run --rm migrate npm run migrate:status
```

Para verificar el historial:

```bash
docker compose exec db psql -U postgres -d repusense_db \
  -c 'SELECT id, name, run_on FROM pgmigrations ORDER BY id;'
```

Los tests del backend no dependen de las tablas de negocio, pero la base debe
existir y ser accesible.

## Frontend

```bash
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

## Verificación manual del entorno

```bash
docker compose config
docker compose up --build -d
curl http://localhost:5000/api/health
curl http://localhost:5173/
docker compose ps
```

## Pendiente

- Tests de integración de los módulos de negocio.
- Tests end-to-end (por ejemplo Playwright).
