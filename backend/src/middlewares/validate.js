const { error } = require('../utils/respuesta');

// Middleware que valida body, query y params con esquemas de Zod.
// Uso: validar({ body: schemaBody, query: schemaQuery, params: schemaParams })
// Si hay errores responde 422 con un mensaje claro
function validar(esquemas) {
    return (req, res, next) => {
        const validados = {};
        const errores = [];

        for (const [parte, esquema] of Object.entries(esquemas)) {
            const entrada = parte === 'body' ? (req.body ?? {}) : req[parte];
            const resultado = esquema.safeParse(entrada);

            if (resultado.success) {
                validados[parte] = resultado.data;
            } else {
                for (const problema of resultado.error.issues) {
                    errores.push({
                        campo: problema.path.join('.') || parte,
                        mensaje: problema.message,
                    });
                }
            }
        }

        if (errores.length > 0) {
            const resumen = errores.map((e) => `${e.campo}: ${e.mensaje}`).join('; ');
            return error(res, 422, `Datos inválidos. ${resumen}`, errores);
        }

        req.validated = validados;
        next();
    };
}

module.exports = { validar };
