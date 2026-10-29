# Stack tecnológico

**Estado:** Stack base implementado; extracción e IA pendientes de decisión  
**Última actualización:** 2026-10-29

| Capa | Tecnología | Estado |
|---|---|---|
| Backend | Node.js + Express 5 | Implementado |
| Frontend | React 19 + Vite (JavaScript) | Implementado (scaffold) |
| Base de datos | PostgreSQL 18 | Implementado (base limpia) |
| Migraciones | `node-pg-migrate` (SQL) | Implementado |
| Infraestructura | Docker Compose | Implementado |
| Tests backend | `node:test` | Implementado |
| Data / scraping | Node.js, Puppeteer, Crawlee | Pendiente de validar fuentes y condiciones de uso |
| IA | OpenAI API, Anthropic o modelo local vía Ollama/LangChain | Comparación pendiente |

## Notas

- **Docker Compose es el único flujo de desarrollo soportado.** Node.js, npm y
  PostgreSQL no se instalan en el host: dev, tests, lint, build y migraciones se
  ejecutan en contenedores. El servicio `migrate` monta `database/` con escritura y
  expone todos los scripts npm (`migrate:create`, `migrate:up`, etc.); es el mismo
  servicio que aplica las pendientes al arrancar.
- El backend se resolvió con **Express** (no NestJS) para mantener el scaffold simple.
- El frontend está en **JavaScript**. La documentación inicial proponía TypeScript;
  una migración queda como decisión del equipo, no como requisito del scaffold.
- PostgreSQL 18 usa el volumen en `/var/lib/postgresql` (cambio respecto de versiones
  anteriores). Si se baja de versión, revisar la ruta del volumen.
- Node.js se fija en la imagen `node:24-alpine` (LTS) para los contenedores.
- Las migraciones usan `node-pg-migrate` con archivos `.sql` y un wrapper propio
  (`backend/scripts/migrate.js`) para unificar comandos, estados y conexión. Se eligió
  SQL explícito sobre helpers JS para que el esquema sea revisable y portable.

## Criterio de selección de IA

Comparar calidad en español, consistencia de etiquetas, calidad del borrador, coste,
latencia, facilidad de integración, privacidad y capacidad de evaluar resultados.
Ver `plan-ia.md`.
