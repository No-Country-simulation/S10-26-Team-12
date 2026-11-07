import "dotenv/config"; // carga las variables del archivo .env de la carpeta actual
import Groq from "groq-sdk";

// LLM: único archivo que sabe hablar con Groq.
// Si algún día cambiamos de proveedor (Gemini, etc.), se cambia SOLO este
// archivo: el resto del código usa la función llamarLLM() y no se entera.

// Una "función de LLM" recibe (reglas, datos) y devuelve el texto del modelo. Definir este tipo nos permite reemplazarla por una falsa en las pruebas.
export type LLMFn = (system: string, user: string) => Promise<string>;

const MODELO_POR_DEFECTO = "openai/gpt-oss-120b";

let cliente: Groq | null = null;

function obtenerCliente(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Falta la variable de entorno GROQ_API_KEY");
  }
  cliente ??= new Groq({ apiKey });
  return cliente;
}

export const llamarLLM: LLMFn = async (system, user) => {
  const respuesta = await obtenerCliente().chat.completions.create({
    model: process.env.GROQ_MODEL ?? MODELO_POR_DEFECTO,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.3,
    max_completion_tokens: 2000,
  });

  return respuesta.choices[0]?.message?.content ?? "";
};