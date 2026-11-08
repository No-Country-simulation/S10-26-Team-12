// Convierte un valor en una celda de CSV segura.
function celda(valor) {
    if (valor === null || valor === undefined) return '';
    let texto = String(valor);

    // Protección: si un texto (ej. el nombre de un negocio sacado de internet) empieza con
    // = + - @ Excel lo puede interpretar como fórmula. Le ponemos un apóstrofe adelante.
    // Excepción: lo que parece un teléfono o un número (solo dígitos, espacios, + - ( ) .) no se toca.
    const pareceTelefono = /^\+?[\d\s().-]+$/.test(texto);
    if (typeof valor === 'string' && /^[=+\-@\t\r]/.test(texto) && !pareceTelefono) {
        texto = `'${texto}`;
    }

    // Si tiene coma, comillas o salto de línea, se encierra entre comillas (y se duplican las comillas).
    if (/[",\r\n]/.test(texto)) {
        texto = `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
}

// Arma el CSV completo. "columnas" es una lista de { campo, titulo }.
// Empieza con BOM (\uFEFF) para que Excel muestre bien las tildes.
function generarCsv(filas, columnas) {
    const encabezado = columnas.map((c) => celda(c.titulo)).join(',');
    const lineas = filas.map((fila) => columnas.map((c) => celda(fila[c.campo])).join(','));
    return `\uFEFF${[encabezado, ...lineas].join('\r\n')}\r\n`;
}

module.exports = { celda, generarCsv };
