# Arquitectura

**Estado:** Pendiente  
**Responsable:** TODO: nombre

## Propuesta inicial
1. **Frontend:** React + TypeScript para búsqueda, filtros, tabla de prospectos y acciones.
2. **Backend:** Express o NestJS sobre Node.js para exponer la API y orquestar los procesos.
3. **Extracción:** Puppeteer/Crawlee, sujeto a la fuente seleccionada y sus condiciones de acceso.
4. **Persistencia:** PostgreSQL para negocios, datos extraídos, resultados de análisis y seguimiento.
5. **IA:** servicio intercambiable para etiquetar problemas y generar borradores.

## Flujo previsto
1. El usuario envía rubro, ubicación y filtros.
2. El backend valida la consulta y coordina la extracción.
3. Los datos se normalizan y se identifican registros existentes.
4. Se guardan o actualizan los negocios y los datos disponibles.
5. La IA analiza las reseñas seleccionadas cuando corresponda.
6. El frontend presenta los resultados y permite exportarlos.

## Decisiones pendientes
- [ ] Elegir Express o NestJS.
- [ ] Definir si la extracción se ejecuta en la petición o mediante trabajos en segundo plano.
- [ ] Definir proveedor(es) de datos y estrategia ante límites/errores.
- [ ] Definir modelo de datos y política de actualización.
- [ ] Definir autenticación mínima para la demo.
- [ ] Añadir diagrama de componentes y despliegue cuando las decisiones estén cerradas.
