import { analisisResenasSchema, type AnalisisResenas } from "./ai.schema";
import {
  SYSTEM_PROMPT,
  construirPromptUsuario,
  prepararResenas,
  type LeadParaIA,
  type ResenaParaIA,
} from "./ai.prompt";
import { llamarLLM, type LLMFn } from "./llm";

// SERVICIO DE IA: junta todo. Recibe un negocio y sus reseñas, le pregunta al modelo, valida la respuesta con Zod y maneja los errores.

const MAX_INTENTOS = 2;

// Lo que devuelve la función: o salió bien (con los datos validados) o falló (con problema "otro" y el motivo del error).
// El campo `exito` permite que TypeScript sepa qué propiedades existen en cada caso.
export type ResultadoAnalisis =
  | { exito: true; datos: AnalisisResenas }
  | { exito: false; problema: "otro"; error: string };

function extraerJSON(texto: string): unknown {
  const inicio = texto.indexOf("{");
  const fin = texto.lastIndexOf("}");
  if (inicio === -1 || fin <= inicio) {
    throw new Error("La respuesta no contiene un JSON");
  }
  return JSON.parse(texto.slice(inicio, fin + 1));
}

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function etiquetarYRedactar(
  lead: LeadParaIA,
  resenas: ResenaParaIA[],
  llm: LLMFn = llamarLLM,
): Promise<ResultadoAnalisis> {
  const resenasLimpias = prepararResenas(resenas);

  if (resenasLimpias.length === 0) {
    return { exito: false, problema: "otro", error: "No hay reseñas para analizar" };
  }

  const promptUsuario = construirPromptUsuario(lead, resenasLimpias);
  let ultimoError = "";

  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    try {
      const texto = await llm(SYSTEM_PROMPT, promptUsuario);
      const json = extraerJSON(texto);
      const validacion = analisisResenasSchema.safeParse(json);

      if (validacion.success) {
        return { exito: true, datos: validacion.data };
      }

      // La IA respondió, pero algún campo no cumple las reglas de Zod.
      ultimoError =
        "JSON inválido: " +
        validacion.error.issues
          .map((i) => `${i.path.join(".") || "(raíz)"}: ${i.message}`)
          .join("; ");
    } catch (error) {
      // Falló la llamada a Groq o la respuesta no era un JSON legible.
      ultimoError = mensajeDeError(error);
    }

    console.warn(`[ia] "${lead.nombre}": intento ${intento}/${MAX_INTENTOS} falló: ${ultimoError}`);
  }

  // Los dos intentos fallaron: registramos el error y devolvemos "otro".
  console.error(`[ia] "${lead.nombre}": no se pudo analizar. Motivo: ${ultimoError}`);
  return { exito: false, problema: "otro", error: ultimoError };
}