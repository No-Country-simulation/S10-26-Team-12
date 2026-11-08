const { z } = require('zod');
const contrato = require('../contrato/contrato-lead.json');
const { limites } = require('../config/api.config');

// Los enums salen del contrato (criterio 7), así nunca quedan distintos a la documentación.
const ESTADOS = contrato.enums.EstadoLead;
const PROBLEMAS = contrato.enums.Problema;

// Texto obligatorio: no puede faltar, ni estar vacío, ni pasarse del largo máximo.
const texto = (campo, max) =>
    z
        .string({
            error: (issue) =>
                issue.input === undefined ? `${campo} es obligatorio` : `${campo} debe ser texto`,
        })
        .trim()
        .min(1, `${campo} no puede estar vacío`)
        .max(max, `${campo} no puede superar los ${max} caracteres`);

// Filtro de texto opcional (query string). Un valor vacío ("?pais=") se ignora.
const filtroTexto = (campo, max) =>
    z
        .string({ error: `${campo} debe ser texto` })
        .trim()
        .max(max, `${campo} no puede superar los ${max} caracteres`)
        .transform((valor) => (valor === '' ? undefined : valor))
        .optional();

// Filtro opcional que solo acepta los valores de una lista (enum). Vacío se ignora.
const filtroEnum = (campo, valores) =>
    z.preprocess(
        (valor) => (valor === '' ? undefined : valor),
        z
            .enum(valores, {
                error: `${campo} inválido. Valores permitidos: ${valores.join(', ')}`,
            })
            .optional(),
    );

// Número opcional con mínimo y máximo (los query params llegan como texto, acá se convierten).
const numeroOpcional = (campo, min, max) =>
    z.preprocess(
        (valor) => (valor === '' || valor === undefined ? undefined : Number(valor)),
        z
            .number({ error: `${campo} debe ser un número` })
            .min(min, `${campo} no puede ser menor a ${min}`)
            .max(max, `${campo} no puede ser mayor a ${max}`)
            .optional(),
    );

// Entero con valor por defecto (para page y limit).
const enteroConDefecto = (campo, min, max, porDefecto) =>
    z.preprocess(
        (valor) => (valor === '' || valor === undefined ? undefined : Number(valor)),
        z
            .number({ error: `${campo} debe ser un número entero` })
            .int(`${campo} debe ser un número entero`)
            .min(min, `${campo} no puede ser menor a ${min}`)
            .max(max, `${campo} no puede ser mayor a ${max}`)
            .default(porDefecto),
    );

const objeto = (forma) => z.object(forma, { error: 'El cuerpo debe ser un objeto JSON' });

// Esquemas por endpoint

// POST /auth/login
const loginBody = objeto({
    clave: texto('clave', 200),
});

// POST /busquedas (criterios 1 y 9)
const busquedaBody = objeto({
    ciudad: texto('ciudad', limites.largoMaxCiudad),
    pais: texto('pais', limites.largoMaxPais),
    rubro: texto('rubro', limites.largoMaxRubro),
    // true = ignorar la regla de los 5 días y correr la búsqueda de nuevo.
    forzar: z.boolean({ error: 'forzar debe ser true o false' }).default(false),
    // Tope de resultados de esta búsqueda. No puede pasar el máximo configurado.
    max_resultados: z
        .number({ error: 'max_resultados debe ser un número entero' })
        .int('max_resultados debe ser un número entero')
        .min(1, 'max_resultados debe ser al menos 1')
        .refine((n) => n <= limites.maxResultadosBusqueda, {
            error: () => `max_resultados no puede superar ${limites.maxResultadosBusqueda}`,
        })
        .optional(),
});

// Parámetro :id de la URL (siempre llega como texto; se valida y se pasa a número).
const idParams = z.object({
    id: z
        .string()
        .regex(/^[1-9]\d*$/, 'El id debe ser un número entero positivo')
        .transform(Number),
});

// GET /leads y GET /leads/export (criterio 3)
const filtrosLeads = {
    pais: filtroTexto('pais', limites.largoMaxPais),
    ciudad: filtroTexto('ciudad', limites.largoMaxCiudad),
    problema: filtroEnum('problema', PROBLEMAS),
    estado: filtroEnum('estado', ESTADOS),
    rating_min: numeroOpcional('rating_min', 0, 5),
    rating_max: numeroOpcional('rating_max', 0, 5),
};

// Regla extra: el mínimo no puede ser mayor que el máximo.
const ratingCoherente = [
    (q) => q.rating_min === undefined || q.rating_max === undefined || q.rating_min <= q.rating_max,
    { error: 'rating_min no puede ser mayor que rating_max', path: ['rating_min'] },
];

const listarLeadsQuery = z
    .object({
        ...filtrosLeads,
        page: enteroConDefecto('page', 1, 1000000, 1),
        limit: enteroConDefecto('limit', 1, 100, 20),
    })
    .refine(...ratingCoherente);

const exportarLeadsQuery = z.object(filtrosLeads).refine(...ratingCoherente);

// PATCH /leads/:id/estado (criterio 5): solo los 7 estados del contrato.
const estadoBody = objeto({
    estado: z.enum(ESTADOS, {
        error: (issue) =>
            issue.input === undefined
                ? `estado es obligatorio. Valores permitidos: ${ESTADOS.join(', ')}`
                : `estado inválido. Valores permitidos: ${ESTADOS.join(', ')}`,
    }),
});

module.exports = {
    loginBody,
    busquedaBody,
    idParams,
    listarLeadsQuery,
    exportarLeadsQuery,
    estadoBody,
};
