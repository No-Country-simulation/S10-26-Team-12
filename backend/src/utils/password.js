// Hash de contraseñas con scrypt, que viene incluido en Node (no hace falta instalar nada).
// Formato guardado en la base: scrypt$N$r$p$salt$hash
// Los parámetros van dentro del texto, así se puede verificar una contraseña aunque más adelante se cambie la configuración para los usuarios nuevos.
// El seed (prisma/seed.ts) y el futuro login (tarjeta #16) tienen que usar estas mismas funciones.
const crypto = require('node:crypto');

const N = 16384; // costo de cálculo (cuanto más alto, más difícil de adivinar por fuerza bruta)
const R = 8;
const P = 1;
const LARGO_CLAVE = 64;

// Convierte una contraseña en un texto seguro para guardar en usuarios.password_hash.
function hashPassword(password) {
    const salt = crypto.randomBytes(16); // "sal" al azar: dos usuarios con la misma clave tienen hashes distintos
    const hash = crypto.scryptSync(String(password), salt, LARGO_CLAVE, { N, r: R, p: P });
    return ['scrypt', N, R, P, salt.toString('base64'), hash.toString('base64')].join('$');
}

// Devuelve true si la contraseña coincide con el hash guardado.
function verifyPassword(password, guardado) {
    if (typeof guardado !== 'string') return false;

    const [algoritmo, n, r, p, salBase64, hashBase64] = guardado.split('$');
    if (algoritmo !== 'scrypt' || !salBase64 || !hashBase64) return false;

    const esperado = Buffer.from(hashBase64, 'base64');
    const calculado = crypto.scryptSync(String(password), Buffer.from(salBase64, 'base64'), esperado.length, {
        N: Number(n),
        r: Number(r),
        p: Number(p),
    });

    return crypto.timingSafeEqual(calculado, esperado);
}

module.exports = { hashPassword, verifyPassword };
