const crypto = require('node:crypto');
const config = require('../config/api.config');

// Token simple sin librerías: "<datos>.<firma>". La firma se calcula con la API_KEY,
// así nadie puede inventar un token válido sin conocer la clave.

function firmar(datos) {
    return crypto.createHmac('sha256', config.apiKey).update(datos).digest('base64url');
}

// Crea un token que vence en N horas (TOKEN_HORAS).
function crearToken() {
    const vence = Date.now() + config.limites.tokenHoras * 60 * 60 * 1000;
    const datos = Buffer.from(JSON.stringify({ exp: vence })).toString('base64url');
    return `${datos}.${firmar(datos)}`;
}

// Devuelve true si el token es nuestro (firma correcta) y no venció.
function verificarToken(token) {
    if (!config.apiKey || typeof token !== 'string') return false;

    const [datos, firma] = token.split('.');
    if (!datos || !firma) return false;

    const esperada = Buffer.from(firmar(datos));
    const recibida = Buffer.from(firma);
    if (esperada.length !== recibida.length || !crypto.timingSafeEqual(esperada, recibida)) {
        return false;
    }

    try {
        const { exp } = JSON.parse(Buffer.from(datos, 'base64url').toString());
        return typeof exp === 'number' && exp > Date.now();
    } catch {
        return false;
    }
}

// Compara la clave que mandó el usuario con la API_KEY sin filtrar información por tiempo de respuesta.
function claveCorrecta(claveRecibida) {
    if (!config.apiKey) return false;
    const hash = (texto) => crypto.createHash('sha256').update(String(texto)).digest();
    return crypto.timingSafeEqual(hash(claveRecibida), hash(config.apiKey));
}

module.exports = { crearToken, verificarToken, claveCorrecta };
