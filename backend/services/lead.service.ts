import { prisma } from "../prisma-client";

type DatosLead = {
    place_id: string;
    nombre: string;
    pais: string;
    ciudad: string;
    rubro: string;
    rating: number;
    review_count: number;
};

export async function guardarLead(datos: DatosLead) {
    return prisma.lead.upsert({
        where: {
            place_id: datos.place_id,
        },

        create: {
            ...datos,
        },

        update: {
            nombre: datos.nombre,
            pais: datos.pais,
            ciudad: datos.ciudad,
            rubro: datos.rubro,
            rating: datos.rating,
            review_count: datos.review_count,
        },
    });
}