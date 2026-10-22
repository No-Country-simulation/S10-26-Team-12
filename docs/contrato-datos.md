# Contrato de datos

**Estado:** Pendiente  
**Responsable:** TODO: nombre

Este documento definirá el esquema persistido y los contratos entre frontend, backend, extracción e IA. Los campos de abajo son una propuesta inicial, no un contrato definitivo.

## Entidad: Lead / negocio
- `id`: identificador interno.
- `source`: fuente de origen.
- `source_business_id`: identificador del negocio en la fuente, si existe.
- `name`: nombre del negocio.
- `category`: rubro.
- `city`, `country`: ubicación normalizada.
- `rating`: calificación numérica, si está disponible.
- `review_count`: cantidad de reseñas, si está disponible.
- `website`, `phone`, `email`: datos de contacto disponibles; pueden ser nulos.
- `detected_problem`: etiqueta o resumen del problema detectado.
- `commercial_status`: estado de seguimiento.
- `last_contacted_at`: fecha del último contacto, si corresponde.
- `contacted_by`: usuario o integrante responsable, si corresponde.
- `first_seen_at`, `last_seen_at`, `last_refreshed_at`: fechas de seguimiento.
- `created_at`, `updated_at`: fechas internas.

## Estados comerciales registrados en la bitácora
- Nuevo
- Contactado
- Interesado
- No responde
- Ganado
- Perdido
- Descartado

Confirmar con el equipo los valores definitivos y sus transiciones.

## Pendientes
- [ ] Definir clave de deduplicación.
- [ ] Definir esquema de reseñas y retención de texto.
- [ ] Definir tipos, nulabilidad e índices.
- [ ] Definir respuestas y errores de la API.
- [ ] Definir formato CSV y campos exportados.
- [ ] Definir qué datos se actualizan y con qué frecuencia.
