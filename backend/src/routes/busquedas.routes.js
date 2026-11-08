const express = require('express');
const { validar } = require('../middlewares/validate');
const { busquedaBody, idParams } = require('../schemas/api.schemas');
const { exito, error } = require('../utils/respuesta');
const { crearSearchKey, normalizar } = require('../utils/texto');
const config = require('../config/api.config');
const { busquedas, corridas, nuevoId } = require('../mock/busquedas.mock');
const { leads } = require('../mock/leads.mock');

const router = express.Router();
const DIA = 24 * 60 * 60 * 1000;

// Cuántas búsquedas nuevas se lanzaron hoy (día UTC).
const corridasDeHoy = () => {
    const hoy = new Date().toISOString().slice(0, 10);
    return corridas.filter((fecha) => fecha.startsWith(hoy)).length;
};

/**
 * POST /api/busquedas
 * Recibe { ciudad, pais, rubro, forzar?, max_resultados? } y devuelve el id de la búsqueda.
 * - Si ya hay una búsqueda igual de hace menos de 5 días, devuelve esa (reutilizada: true).
 * - Con "forzar": true se vuelve a correr igual.
 * - Hay un tope de búsquedas nuevas por día (429 si se pasa).
 */
router.post('/', validar({ body: busquedaBody }), (req, res) => {
    const { ciudad, pais, rubro, forzar, max_resultados } = req.validated.body;
    const maxResultados = max_resultados ?? config.limites.maxResultadosBusqueda;

    // En la base, search_key es única: una búsqueda equivalente es siempre la misma fila.
    const searchKey = crearSearchKey({ pais, ciudad, rubro });
    const existente = busquedas.find((b) => b.search_key === searchKey);

    const esReciente =
        existente?.ultima_corrida &&
        Date.now() - Date.parse(existente.ultima_corrida) < config.limites.diasReutilizarBusqueda * DIA;

    // Caso 1: reutilizar la búsqueda reciente.
    if (existente && esReciente && !forzar) {
        return exito(res, {
            id: existente.id,
            reutilizada: true,
            ultima_corrida: existente.ultima_corrida,
            max_resultados: maxResultados,
        });
    }

    // Caso 2: hay que correr una búsqueda nueva. Primero se controla el tope diario.
    if (corridasDeHoy() >= config.limites.maxBusquedasPorDia) {
        return error(
            res,
            429,
            `Se alcanzó el máximo de ${config.limites.maxBusquedasPorDia} búsquedas por día. Probá de nuevo mañana.`,
        );
    }

    const ahora = new Date().toISOString();
    let busqueda = existente;

    if (busqueda) {
        busqueda.ultima_corrida = ahora; // mismo registro, solo se actualiza la fecha
    } else {
        // Nota: en la base real también se guardan las coordenadas (lat/long min y max) de la ciudad.
        busqueda = { id: nuevoId(), search_key: searchKey, ciudad, pais, rubro, ultima_corrida: ahora };
        busquedas.push(busqueda);
    }
    corridas.push(ahora);

    return exito(
        res,
        { id: busqueda.id, reutilizada: false, ultima_corrida: ahora, max_resultados: maxResultados },
        201,
    );
});

/**
 * GET /api/busquedas/:id
 * Devuelve los datos de la búsqueda y cuántos leads tiene (total_leads se calcula, no es una columna).
 */
router.get('/:id', validar({ params: idParams }), (req, res) => {
    const busqueda = busquedas.find((b) => b.id === req.validated.params.id);
    if (!busqueda) {
        return error(res, 404, `No existe la búsqueda con id ${req.validated.params.id}`);
    }

    const totalLeads = leads.filter(
        (l) =>
            normalizar(l.pais) === normalizar(busqueda.pais) &&
            normalizar(l.ciudad) === normalizar(busqueda.ciudad) &&
            normalizar(l.rubro) === normalizar(busqueda.rubro),
    ).length;

    return exito(res, {
        id: busqueda.id,
        ciudad: busqueda.ciudad,
        pais: busqueda.pais,
        rubro: busqueda.rubro,
        ultima_corrida: busqueda.ultima_corrida,
        total_leads: totalLeads,
    });
});

module.exports = router;
