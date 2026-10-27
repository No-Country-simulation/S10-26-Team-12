# Decisiones técnicas y dudas abiertas

**Estado:** Pendiente de resolución y registro  
**Responsable:** TODO: nombre

## Decisiones / acuerdos registrados en la bitácora del 14–15/10
- Primera opción de stack: Node.js con Puppeteer/Crawlee, backend Express o NestJS, React + TypeScript y PostgreSQL.
- Se busca permitir consultas por ciudad/país y rubro, sin limitar de entrada las ubicaciones.
- El CSV resumirá nombre, ciudad (pendiente de confirmar), calificación, problema resumido con IA, estado y contacto.
- Se propone almacenar los negocios devueltos por la fuente y aplicar filtros sobre los datos guardados, para evitar repetir llamadas por cada cambio de filtro.
- Se mencionó actualizar los datos aproximadamente cada cinco días; confirmar viabilidad y alcance.
- Se propuso registrar estado comercial, fecha del último contacto y quién contactó al negocio.
- La autenticación mínima se considera opcional para la demo; la bitácora menciona usuarios precargados, contraseña con hash y JWT como alternativa, y una clave simple como plan B.

Estos puntos son notas de reunión, no todos constituyen decisiones finales.

## Dudas técnicas prioritarias

### Fuentes, límites y bloqueos
- [ ] ¿Qué fuente se usará primero (por ejemplo, una API oficial o una fuente pública)?
- [ ] ¿Qué condiciones de uso, límites y restricciones aplican?
- [ ] ¿Cómo manejar errores, cuotas, reintentos y pausas de forma compatible con la fuente?

### Enriquecimiento de contactos
- [ ] ¿Qué campos de contacto ofrece la fuente elegida?
- [ ] ¿Se consultará la web oficial del negocio para completar datos públicos?
- [ ] ¿Cómo se marcarán datos no encontrados o no verificados?

### Duplicados y actualización
- [ ] ¿Qué combinación identifica de forma estable a un negocio?
- [ ] ¿Cómo se actualizan los registros existentes en lugar de duplicarlos?
- [ ] ¿Cómo se evita volver a contactar un lead por error?
- [ ] ¿Cada cuánto se refrescan calificaciones, reseñas y contactos?

### Filtrado y persistencia
- [ ] ¿Se guardan todos los negocios devueltos por la fuente o solo los que cumplen los filtros iniciales?
- [ ] ¿Los filtros se aplican en SQL, durante la extracción o en ambos puntos?
- [ ] ¿Qué índices se necesitan para ubicación, rubro, calificación y estado?

### Seguridad y auditoría
- [ ] ¿La demo requiere autenticación?
- [ ] ¿Qué eventos deben quedar registrados en logs/auditoría?
- [ ] ¿Quién puede exportar datos y modificar estados comerciales?

## Plantilla para registrar una decisión
- **ID / fecha:** TODO
- **Contexto:** TODO
- **Opciones consideradas:** TODO
- **Decisión:** TODO
- **Motivo:** TODO
- **Consecuencias / riesgos:** TODO
- **Responsable:** TODO
