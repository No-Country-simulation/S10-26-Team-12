# Plan de IA

**Estado:** Pendiente de selección y validación  
**Responsable:** TODO: nombre

## Objetivos
1. Etiquetar o resumir los problemas principales mencionados en reseñas negativas disponibles.
2. Generar un asunto y un primer párrafo de correo comercial basado en esos problemas.

## Flujo propuesto
1. Seleccionar las reseñas que cumplan los criterios definidos.
2. Enviar al modelo únicamente el contexto necesario, evitando datos personales innecesarios.
3. Solicitar una salida estructurada con etiquetas permitidas, resumen breve y evidencia textual o referencia a las reseñas.
4. Validar la respuesta y guardar modelo/versión, fecha y resultado cuando sea necesario para depuración.
5. Presentar el resultado como asistencia para el vendedor, sujeto a revisión humana.
6. Generar el borrador de correo sin enviarlo automáticamente.

## Proveedores a evaluar
- OpenAI API.
- Anthropic.
- Modelo local mediante Ollama (y herramientas de integración que el equipo elija).

No se ha seleccionado un proveedor definitivo.

## Criterios de evaluación
- Calidad y consistencia de etiquetas.
- Calidad del resumen en español.
- Personalización del borrador sin inventar hechos.
- Latencia y coste por negocio.
- Facilidad de integración con Node.js.
- Privacidad y condiciones de tratamiento de datos.
- Manejo de errores, respuestas inválidas y límites de uso.

## Prueba inicial
- [ ] Preparar un conjunto pequeño de reseñas revisadas manualmente.
- [ ] Definir categorías iniciales (por ejemplo, atención, precios, demoras, higiene), sin asumir que cubren todos los casos.
- [ ] Comparar las salidas de los candidatos con etiquetas humanas.
- [ ] Revisar que el correo no afirme hechos que no estén respaldados por las reseñas.
- [ ] Definir criterios de aceptación antes de elegir proveedor.

## Salvaguardas
- La IA no debe inventar reseñas ni datos de contacto.
- Mostrar incertidumbre cuando las reseñas sean insuficientes o ambiguas.
- El borrador debe revisarse antes de cualquier envío.
- No enviar automáticamente correos desde el MVP sin una decisión explícita del equipo.
