const express = require('express');
const { validar } = require('../middlewares/validate');
const { loginBody } = require('../schemas/api.schemas');
const { claveCorrecta, crearToken } = require('../utils/token');
const { exito, error } = require('../utils/respuesta');
const config = require('../config/api.config');

const router = express.Router();

/**
 * POST /api/auth/login
 * Recibe { clave }, la compara con la variable de entorno API_KEY y devuelve un token.
 * Ese token se manda después en el header "Authorization: Bearer <token>".
 */
router.post('/login', validar({ body: loginBody }), (req, res) => {
    // Si el servidor no tiene la clave configurada es un error nuestro, no del usuario.
    if (!config.apiKey) {
        return error(res, 500, 'El servidor no tiene configurada la variable API_KEY');
    }

    if (!claveCorrecta(req.validated.body.clave)) {
        return error(res, 401, 'Clave incorrecta');
    }

    return exito(res, {
        token: crearToken(),
        tipo: 'Bearer',
        expira_en_horas: config.limites.tokenHoras,
    });
});

module.exports = router;
