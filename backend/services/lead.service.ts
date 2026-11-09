import { createHash } from "node:crypto";
import { prisma } from "../prisma-client";

import { etiquetarYRedactar } from "../src/modules/ai/ai.service";
import type { LeadParaIA, ResenaParaIA } from "../src/modules/ai/ai.prompt";

// Datos básicos del negocio.
type DatosLead = {
  place_id: string;
  nombre: string;
  pais: string;
  ciudad: string;
  rubro: string;
  rating: number;
  review_count: number;
};

// Datos necesarios para guardar una reseña.
type DatosResena = {
  id_extern: string;
  texto: string;
  rating: number;
  fecha: Date | string;
  autor?: string | null;
  fuente: "google_maps" | "yelp" | "tripadvisor";
};

// Guarda el negocio, sus reseñas y analiza las reseñas con IA.
export async function guardarLead(
  datos: DatosLead,
  resenas: DatosResena[] = [],
) {
  // Guarda o actualiza el negocio sin duplicarlo.
  const lead = await prisma.lead.upsert({
    where: {
      place_id: datos.place_id,
    },

    create: {
      ...datos,
    },

    // Si el negocio ya existe, solo se actualizan estos campos.
    // A propósito NO se tocan estado ni fecha_ultimo_contacto (ni contactado_por, email, telefono):
    // si el vendedor ya marcó el lead como "contactado", volver a buscar no lo borra.
    update: {
      nombre: datos.nombre,
      pais: datos.pais,
      ciudad: datos.ciudad,
      rubro: datos.rubro,
      rating: datos.rating,
      review_count: datos.review_count,
    },
  });

  // Guarda las reseñas: las nuevas se agregan y las que ya existían (mismo lead + id_extern)
  // se actualizan con el texto y el rating más recientes.
  if (resenas.length > 0) {
    await prisma.$transaction(
      resenas.map((resena) => {
        const fecha = new Date(resena.fecha);

        return prisma.resena.upsert({
          where: {
            lead_id_id_extern: {
              lead_id: lead.id,
              id_extern: resena.id_extern,
            },
          },
          create: {
            ...resena,
            fecha,
            lead_id: lead.id,
          },
          update: {
            texto: resena.texto,
            rating: resena.rating,
            fecha,
            autor: resena.autor ?? null,
            fuente: resena.fuente,
          },
        });
      }),
    );
  }

  // Recupera las últimas reseñas negativas del negocio.
  const resenasNegativas = await prisma.resena.findMany({
    where: {
      lead_id: lead.id,
      rating: {
        lte: 3,
      },
    },
    orderBy: {
      fecha: "desc",
    },
    take: 5,
  });

  // Si no hay reseñas negativas, no se llama a la IA.
  if (resenasNegativas.length === 0) {
    return lead;
  }

  // Calcula un hash para detectar cambios en las reseñas.
  const contenidoResenas = JSON.stringify(
    resenasNegativas.map((r) => ({
      id: r.id_extern,
      texto: r.texto,
      rating: r.rating,
      fecha: r.fecha.toISOString(),
    })),
  );

  const hashActual = createHash("sha256")
    .update(contenidoResenas)
    .digest("hex");

  // Si las reseñas no cambiaron, no gastamos otra llamada a Groq.
  if (lead.hash_resenas === hashActual) {
    return lead;
  }

  // Prepara los datos del negocio y las reseñas para la IA.
  const leadIA: LeadParaIA = {
    nombre: lead.nombre,
    rubro: lead.rubro,
    ciudad: lead.ciudad,
    pais: lead.pais,
  };

  const resenasIA: ResenaParaIA[] = resenasNegativas.map((r) => ({
    texto: r.texto,
    rating: r.rating,
  }));

  // Ejecuta el análisis de IA.
  const resultadoIA = await etiquetarYRedactar(leadIA, resenasIA);

  // Si la IA falla, conservamos el negocio y sus reseñas.
  // Al no guardar el hash, se podrá intentar nuevamente después.
  if (!resultadoIA.exito) {
    console.warn(
      `[lead] No se pudo analizar "${lead.nombre}": ${resultadoIA.error}`,
    );

    return lead;
  }

  // Guarda los resultados de la IA en PostgreSQL.
  const leadActualizado = await prisma.lead.update({
    where: {
      id: lead.id,
    },

    data: {
      problema: resultadoIA.datos.problema,
      problema_resumen: resultadoIA.datos.resumen,
      asunto_mail: resultadoIA.datos.asunto,
      contenido_mail: resultadoIA.datos.parrafo,
      hash_resenas: hashActual,
    },
  });

  return leadActualizado;
}
