const { verificarToken } = require('../utils/token');
const { error } = require('../utils/respuesta');

// Protege las rutas
// Si falta o no sirve, responde 401 
function requiereToken(req, res, next) {
    const cabecera = req.get('authorization') || '';
    const [tipo, token] = cabecera.split(' ');

    if (tipo !== 'Bearer' || !verificarToken(token)) {
        return error(res, 401, 'Token faltante, inválido o vencido. Iniciá sesión en POST /api/auth/login');
    }
    next();
}

module.exports = { requiereToken };
