# Arquitectura

**Estado:** Base técnica implementada; módulos de negocio pendientes  
**Última actualización:** 2026-10-29

## Estado actual

El proyecto corre con Docker Compose y tiene cuatro servicios: `db`, `migrate`,
`backend` y `frontend`. El servicio `migrate` es de un solo uso: aplica las
migraciones pendientes y termina.

### Frontend

- React 19 + Vite.
- Pantalla de estado del scaffold que consume `GET /api/health`.
- Sin dashboard de prospectos todavía.
- Variable `VITE_API_URL` para apuntar al backend.

### Backend

- Node.js + Express 5 (JavaScript).
- Estructura por capas preparada: `routes`, `controllers`, `services`,
  `repositories`, `utils`.
- `GET /api/health`: verifica la API y ejecuta `SELECT current_database()` contra
  PostgreSQL. Devuelve `200` si todo responde y `503` si la base no está disponible.
- Manejo de rutas inexistentes y errores en JSON.

### Base de datos

- PostgreSQL 18 con volumen `postgres_data`.
- **Sin tablas ni datos**: se entrega limpia para implementar el esquema.
- Esquema versionado con `node-pg-migrate` en `database/migrations/` (archivos SQL
  con secciones `Up` / `Down`).
- Historial en la tabla `pgmigrations`.
- El servicio `migrate` aplica las pendientes antes del backend y termina. También se
  usa manualmente para crear o gestionar migraciones:
  `docker compose run --rm migrate npm run migrate:create -- nombre`.
- Ver `database/README.md`.

### Infraestructura

- `docker-compose.yml` con healthchecks y `depends_on: service_healthy` para la base.
- El servicio `migrate` monta `database/` con escritura; `backend` la monta en solo
  lectura.
- Dockerfiles con `npm ci` y `.dockerignore`.
- Volumen anónimo para `node_modules` en backend y frontend (no se mezcla con el host).

## Flujo previsto para el negocio

1. El usuario envía rubro, ubicación y filtros.
2. El backend valida la consulta y coordina la extracción.
3. Los datos se normalizan y se identifican registros existentes.
4. Se guardan o actualizan los negocios y los datos disponibles.
5. La IA analiza las reseñas seleccionadas cuando corresponda.
6. El frontend presenta los resultados y permite exportarlos.

## Módulos pendientes de implementar

- Esquema de base de datos y migraciones.
- Autenticación / autorización mínima (si se define para la demo).
- Módulo de extracción y normalización (fuente a definir).
- CRUD de prospectos, filtros y estados comerciales.
- Exportación a CSV.
- Integración con proveedor de IA para resumen y borrador de correo.
- Observabilidad: logs estructurados, auditoría y métricas.

## Decisiones pendientes

- [ ] Definir la fuente de datos y sus condiciones de uso.
- [ ] Definir si la extracción corre en la petición o en segundo plano.
- [ ] Definir modelo de datos, claves de deduplicación e índices.
- [ ] Definir autenticación mínima para la demo.
- [ ] Elegir proveedor de IA.
- [ ] Definir estrategia de despliegue productivo.
