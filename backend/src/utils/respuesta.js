// Formato estándar de respuestas (criterio 4). Todas las rutas responden con estas funciones.

// Éxito: { status: 'success', data }
function exito(res, data, statusHttp = 200) {
    return res.status(statusHttp).json({ status: 'success', data });
}

// Éxito con lista paginada: agrega el bloque "pagination".
function paginado(res, data, { page, limit, total }) {
    return res.status(200).json({
        status: 'success',
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}

// Error: { status: 'error', message, errors? }. "errors" es opcional (se usa en validaciones).
function error(res, statusHttp, message, errors) {
    const cuerpo = { status: 'error', message };
    if (errors && errors.length > 0) cuerpo.errors = errors;
    return res.status(statusHttp).json(cuerpo);
}

module.exports = { exito, paginado, error };
