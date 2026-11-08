import { z } from "zod";

// ESQUEMAS DE VALIDACIÓN (Zod)
// comparan lo que devolvió la IA con las reglas
// de abajo. Si algo no cumple, safeParse() devuelve success: false.

export const problemaSchema = z.enum([
  "atencion",
  "precios",
  "higiene",
  "demoras",
  "calidad",
  "otro",
]);

// texto de 1 a 300 caracteres. .trim() saca espacios de los bordes ANTES de contar, así "   " queda
//  vacío y falla el .min(1).
export const resumenSchema = z
  .string()
  .trim()
  .min(1, "El resumen no puede estar vacío")
  .max(250, "El resumen supera los 250 caracteres");

// Asunto del correo: texto corto, de 1 a 120 caracteres.
export const asuntoSchema = z
  .string()
  .trim()
  .min(1, "El asunto no puede estar vacío")
  .max(80, "El asunto supera los 80 caracteres");

// Primer párrafo del correo: de 1 a 1000 caracteres.
export const parrafoSchema = z
  .string()
  .trim()
  .min(1, "El párrafo no puede estar vacío")
  .max(1000, "El párrafo supera los 1000 caracteres")
  .refine(
    (texto) => {
      const palabras = texto.split(/\s+/).length;
      return palabras >= 40 && palabras <= 90;
    },
    "El párrafo debe tener entre 40 y 90 palabras"
   );
// Idioma: código de 2 o 3 letras en minúscula (es, en, pt...).
// .toLowerCase() convierte "ES" en "es" antes de validar con el regex.
export const idiomaSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z]{2,3}$/, "El idioma debe ser un código de 2 o 3 letras (ej: es, en)");

// Esquema general: la respuesta completa que tiene que devolver la IA, junta los cinco esquemas de arriba en un solo objeto.
export const analisisResenasSchema = z.object({
  problema: problemaSchema,
  resumen: resumenSchema,
  asunto: asuntoSchema,
  parrafo: parrafoSchema,
  idioma: idiomaSchema,
});

// Tipos de TypeScript sacados automáticamente de los esquemas (no se escribena mano, así nunca quedan desactualizados).
export type Problema = z.infer<typeof problemaSchema>;
export type AnalisisResenas = z.infer<typeof analisisResenasSchema>;