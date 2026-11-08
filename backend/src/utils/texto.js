// Saca tildes, pasa a minúsculas y limpia espacios: "  Medellín " -> "medellin".
// Sirve para comparar textos sin que importen mayúsculas ni acentos.
function normalizar(texto) {
    return String(texto)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}

// Clave que identifica una búsqueda "equivalente" (en la base es la columna search_key, única).
// Dos búsquedas con el mismo país, ciudad y rubro dan la misma clave.
function crearSearchKey({ pais, ciudad, rubro }) {
    return [pais, ciudad, rubro].map(normalizar).join('|');
}

module.exports = { normalizar, crearSearchKey };
