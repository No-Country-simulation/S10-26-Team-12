const express = require('express');
const { validar } = require('../middlewares/validate');
const {
    listarLeadsQuery,
    exportarLeadsQuery,
    idParams,
    estadoBody,
} = require('../schemas/api.schemas');
const { exito, paginado, error } = require('../utils/respuesta');
const { normalizar } = require('../utils/texto');
const { generarCsv } = require('../utils/csv');
const { leads } = require('../mock/leads.mock');

const router = express.Router();

// Saca las reseñas de un lead (en las listas no van, solo en el detalle).
const sinResenas = ({ resenas, ...lead }) => lead;

// Aplica los filtros (criterio 3). Cuando se conecte la base, esto pasa a ser un "where" de Prisma
// que usa los índices de pais, ciudad, estado y rating.
function filtrar(f) {
    return leads.filter(
        (l) =>
            (f.pais === undefined || normalizar(l.pais) === normalizar(f.pais)) &&
            (f.ciudad === undefined || normalizar(l.ciudad) === normalizar(f.ciudad)) &&
            (f.problema === undefined || l.problema === f.problema) &&
            (f.estado === undefined || l.estado === f.estado) &&
            (f.rating_min === undefined || l.rating >= f.rating_min) &&
            (f.rating_max === undefined || l.rating <= f.rating_max),
    );
}

// Más nuevos primero (por fecha de creación; si empatan, por id).
const masNuevosPrimero = (a, b) =>
    Date.parse(b.creado_en) - Date.parse(a.creado_en) || b.id - a.id;

/**
 * GET /api/leads
 * Lista paginada. Filtros: pais, ciudad, problema, estado, rating_min, rating_max. Paginación: page, limit.
 */
router.get('/', validar({ query: listarLeadsQuery }), (req, res) => {
    const { page, limit, ...filtros } = req.validated.query;

    const resultado = filtrar(filtros).sort(masNuevosPrimero);
    const desde = (page - 1) * limit;
    const pagina = resultado.slice(desde, desde + limit).map(sinResenas);

    return paginado(res, pagina, { page, limit, total: resultado.length });
});

/**
 * GET /api/leads/export
 * Descarga un CSV con los leads (mismos filtros que /leads, sin paginación).
 * IMPORTANTE: va ANTES de "/:id", si no Express tomaría "export" como si fuera un id.
 */
router.get('/export', validar({ query: exportarLeadsQuery }), (req, res) => {
    const columnas = [
        { campo: 'nombre', titulo: 'nombre' },
        { campo: 'ciudad', titulo: 'ciudad' },
        { campo: 'rating', titulo: 'rating' },
        { campo: 'problema', titulo: 'problema' },
        { campo: 'problema_resumen', titulo: 'problema_resumen' },
        { campo: 'estado', titulo: 'estado' },
        { campo: 'email', titulo: 'email' },
        { campo: 'telefono', titulo: 'telefono' },
    ];

    const filas = filtrar(req.validated.query).sort(masNuevosPrimero);
    const hoy = new Date().toISOString().slice(0, 10);

    res.status(200);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="leads-${hoy}.csv"`);
    return res.send(generarCsv(filas, columnas));
});

/**
 * GET /api/leads/:id
 * Detalle de un lead, con sus reseñas negativas.
 */
router.get('/:id', validar({ params: idParams }), (req, res) => {
    const lead = leads.find((l) => l.id === req.validated.params.id);
    if (!lead) return error(res, 404, `No existe el lead con id ${req.validated.params.id}`);

    return exito(res, lead);
});

/**
 * GET /api/leads/:id/draft
 * Devuelve el borrador de correo en frío generado por la IA (asunto_mail y contenido_mail).
 */
router.get('/:id/draft', validar({ params: idParams }), (req, res) => {
    const lead = leads.find((l) => l.id === req.validated.params.id);
    if (!lead) return error(res, 404, `No existe el lead con id ${req.validated.params.id}`);

    // Si la IA todavía no analizó al lead, no hay borrador que mostrar.
    if (!lead.asunto_mail || !lead.contenido_mail) {
        return error(res, 404, 'Este lead todavía no tiene un borrador de correo generado');
    }

    return exito(res, {
        id: lead.id,
        nombre: lead.nombre,
        asunto_mail: lead.asunto_mail,
        contenido_mail: lead.contenido_mail,
    });
});

/**
 * PATCH /api/leads/:id/estado
 * Cambia el estado del lead. Solo acepta los 7 estados del contrato (si no, 422).
 */
router.patch('/:id/estado', validar({ params: idParams, body: estadoBody }), (req, res) => {
    const lead = leads.find((l) => l.id === req.validated.params.id);
    if (!lead) return error(res, 404, `No existe el lead con id ${req.validated.params.id}`);

    lead.estado = req.validated.body.estado;
    lead.ultima_actualizacion = new Date().toISOString();

    return exito(res, sinResenas(lead));
});

module.exports = router;
