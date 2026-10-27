# RepuSense — Radar de Reputación en Crisis

RepuSense es una herramienta interna de prospección comercial para agencias de marketing digital y relaciones públicas. Busca identificar negocios con señales de problemas de reputación online, organizar sus datos y facilitar que el equipo comercial prepare contactos relevantes.

> **Estado del proyecto:** MVP en definición y desarrollo. La documentación se completa de manera incremental durante las semanas de trabajo.

## Tabla de contenidos

- [Descripción](#descripción)
- [Problema que resuelve](#problema-que-resuelve)
- [Usuario principal](#usuario-principal)
- [Caso de uso principal](#caso-de-uso-principal)
- [Resultado esperado](#resultado-esperado)
- [Alcance del MVP](#alcance-del-mvp)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Contrato de datos](#contrato-de-datos)
- [Cómo correr el proyecto](#cómo-correr-el-proyecto)
- [Decisiones técnicas y dudas abiertas](#decisiones-técnicas-y-dudas-abiertas)
- [Plan de IA](#plan-de-ia)
- [Limitaciones conocidas](#limitaciones-conocidas)
- [Equipo y roles](#equipo-y-roles)
- [Enlaces](#enlaces)
- [Estado de documentación](#estado-de-documentación)
- [Registro de cambios](#registro-de-cambios)

## Descripción

RepuSense automatiza parte de la prospección de una agencia que ofrece servicios de gestión y mejora de reputación online. La solución busca recopilar información pública de negocios, detectar señales reputacionales relevantes, resumir los problemas mencionados en reseñas y presentar los prospectos en un dashboard interno.

La propuesta contempla filtros por ubicación, rubro, calificación y cantidad de reseñas; datos de contacto disponibles; exportación a CSV; seguimiento del estado comercial; y generación asistida por IA de un borrador de correo personalizado.

## Problema que resuelve

Actualmente, el equipo comercial busca manualmente negocios en plataformas de reseñas, revisa sus calificaciones y comentarios, confirma información básica y localiza datos de contacto. Por ejemplo: tres vendedores dedican alrededor de 30 horas semanales a esta tarea y se generan aproximadamente 40 leads por semana.
 
El proceso es lento y dificulta aumentar la cantidad de prospectos calificados. Aca es donde entra RepuSense, esta automatiza el proceso, detectando negocios con problemas reputacionales, identificando los motivos principales de las reseñas negativas y centralizando la información en un panel que facilita la prospección comercial.

## Usuario principal

**Ejecutivo/a o representante de ventas** de una agencia de marketing digital y relaciones públicas.

Es quien utiliza la plataforma para encontrar potenciales clientes, analizar sus necesidades, consultar los datos disponibles, registrar el seguimiento comercial y preparar contactos comerciales personalizados.

Entre sus tareas principales se encuentran:
- Buscar negocios por ciudad y rubro.
- Filtrar negocios según su calificación y cantidad de reseñas.
- Identificar los problemas más frecuentes mencionados por los clientes.
- Consultar datos de contacto y organizar los prospectos.
- Exportar los resultados y generar correos comerciales personalizados con ayuda de IA.


## Caso de uso concreto

Un representante comercial busca restaurantes en Tandil, Buenos Aires, con una calificación inferior a 3,5 estrellas y más de 10 reseñas. RepuSense muestra los negocios que cumplen los filtros, resume los principales problemas mencionados en las reseñas negativas disponibles y presenta los datos de contacto encontrados. El representante puede revisar el prospecto, exportarlo y generar un borrador de correo personalizado con asistencia de IA.

- Búsqueda: ingresa la ubicación Tandil, Buenos Aires, Argentina y el rubro restaurantes.
- Filtrado: configura los criterios para encontrar negocios con una calificación inferior a 3,5 estrellas y más de 10 reseñas.
- Análisis con IA: RepuSense analiza las últimas cinco reseñas negativas disponibles de cada negocio e identifica los principales problemas mencionados, como demoras en la atención, mala calidad del servicio o problemas de higiene.
- Visualización: el sistema presenta los resultados en un dashboard con el nombre del restaurante, su calificación, los problemas detectados y los datos de contacto disponibles.
- Contacto comercial: el vendedor selecciona un restaurante y genera un correo personalizado con ayuda de IA, basado en los problemas identificados en las reseñas, para ofrecerle servicios de mejora de su reputación online.


## Resultado esperado

Reducir el tiempo dedicado a la prospección manual y aumentar la cantidad de prospectos calificados que el equipo comercial puede revisar y contactar. La meta del ejercicio es pasar de unos 40 leads semanales a cientos de contactos potenciales y disponer de una base de al menos 200 leads reales durante las pruebas.

Entregables previstos:
- Motor de extracción funcional para una fuente definida.
- Dashboard interno para consultar y filtrar negocios.
- Persistencia de datos y seguimiento del estado de cada lead.
- Exportación a CSV.
- Funcionalidad de IA que genere un asunto y un primer párrafo de correo basados en problemas identificados en reseñas.

## Alcance del MVP

- Recibir ubicación, rubro y filtros de búsqueda.
- Obtener y guardar información básica de negocios desde la(s) fuente(s) elegida(s).
- Filtrar por calificación y cantidad de reseñas.
- Analizar reseñas disponibles y etiquetar o resumir problemas frecuentes con IA.
- Mostrar los resultados en una tabla o dashboard.
- Guardar datos de contacto encontrados y el estado comercial.
- Exportar leads a CSV.
- Generar un borrador de correo comercial asistido por IA.

**Fuera de alcance o pendiente de decidir:** envío automático de correos, cobertura garantizada de todas las plataformas y países, autenticación completa, enriquecimiento avanzado de contactos y operación a escala productiva. Ver `docs/alcance-mvp.md` y `docs/limitaciones.md`.

## Stack tecnológico

Stack de primera opción registrado en la bitácora de la semana 1:
- **Extracción / Data:** Node.js, Puppeteer y Crawlee.
- **Backend:** Express o NestJS sobre Node.js (elección pendiente).
- **Frontend:** React y TypeScript.
- **Base de datos:** PostgreSQL.
- **IA:** opción por evaluar entre OpenAI API, Anthropic o modelos locales mediante Ollama/LangChain.

Este stack es una primera propuesta, no implica que todas las decisiones estén cerradas. Ver `docs/stack.md`.

## Arquitectura

La arquitectura detallada está pendiente. La propuesta inicial separa:
1. Interfaz web para búsqueda, filtros y revisión de prospectos.
2. API backend para orquestar búsquedas y entregar datos al frontend.
3. Módulo de extracción y normalización de datos.
4. PostgreSQL para persistir negocios, reseñas/resúmenes y seguimiento comercial.
5. Servicio de IA para clasificar problemas y redactar borradores.

Ver `docs/arquitectura.md`.

## Contrato de datos

El modelo y los contratos de API están pendientes de definición. Como mínimo, el equipo debe acordar los campos de negocio, fuente, ubicación, calificación, cantidad de reseñas, problema detectado, contacto disponible, estado comercial, fechas de actualización y clave de deduplicación.

Ver `docs/contrato-datos.md`.

## Cómo correr el proyecto

**Pendiente:** todavía deben definirse los comandos reales de instalación y ejecución, las variables de entorno y la configuración de la base de datos. No ejecutar comandos de ejemplo como si fueran definitivos.

Ver `docs/como-correr.md`.

## Decisiones técnicas y dudas abiertas

Las principales dudas registradas son:
- Qué fuentes se usarán y qué métodos de acceso permiten sus condiciones de uso.
- Cómo gestionar límites, bloqueos y errores de extracción.
- Cómo encontrar y validar datos de contacto.
- Cómo identificar duplicados y actualizar negocios ya guardados.
- Si se implementará autenticación mínima para la demo.
- Cuándo refrescar calificaciones y otros datos.
- Qué eventos se registrarán en logs y auditorías.

Ver `docs/decisiones-tecnicas.md`.

## Plan de IA

La IA se propone para resumir o etiquetar problemas presentes en reseñas y redactar un borrador de asunto y primer párrafo de correo. La selección del proveedor/modelo, evaluación, costes, privacidad y estrategia de fallback siguen pendientes.

Ver `docs/plan-ia.md`.

## Limitaciones conocidas

La cobertura de las plataformas puede ser parcial; los datos de contacto pueden no estar disponibles o no corresponder directamente a una persona responsable; las reseñas pueden ser incompletas o ambiguas; y los resultados de IA requieren revisión humana. También deben verificarse las condiciones de uso, privacidad y límites de cada fuente.

Ver `docs/limitaciones.md`.

## Equipo y roles


| Integrante | Rol / responsabilidad | Documentación asignada |
|---|---|---|
| Juan Alvarez | Backend Developer / Analista de Sistemas | A definir |
| Heinz Beckers | Software Engineer | A definir |
| Pamela Calafate | QA Tester | A definir |
| Adriel Fariña | Frontend Developer | A defirnir |
| Geovanni Casadiegos | Full Stack Developer | A definir |


Ver `docs/equipo-roles.md`.

## Enlaces

- **Repositorio:** https://github.com/No-Country-simulation/S10-26-Team-12.git.
- **Drive del Proyecto:** https://drive.google.com/drive/folders/10SuaizC-GgK-aTKXpAnNpsn3o0ybgwke?usp=drive_link .

## Estado de documentación

El estado refleja la documentación de arranque; cada responsable debe actualizarlo a medida que complete su sección.

| Sección | Estado | Responsable |
|---|---|---|
| Descripción y problema | Completa (borrador inicial) | A Definir |
| Usuario y caso de uso | Completa (borrador inicial) | A Definir |
| Alcance del MVP | Pendiente de validar | A Definir |
| Arquitectura | Pendiente | A Definir |
| Stack | Completa (primera opción) | A Definir |
| Contrato de datos | Pendiente | A Definir |
| Cómo correr | Pendiente | A Definir |
| Decisiones técnicas | Pendiente de resolver dudas | A Definir |
| Plan de IA | Pendiente de selección/evaluación | A Definir |
| Limitaciones | Completa (inicial; ampliar) | A Definir |
| Equipo y roles | Pendiente | A Definir |
| Enlaces | Parcial | A Definir |
| Registro de cambios | En uso | Juan Alvarez |

## Registro de cambios

Consultar [`docs/cambios.md`](docs/cambios.md).
