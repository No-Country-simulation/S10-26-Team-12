// Configuración de la API V1

// Convierte una variable de entorno en entero positivo; si no sirve, usa el valor por defecto.
const entero = (valor, porDefecto) => {
    const n = Number(valor);
    return Number.isInteger(n) && n > 0 ? n : porDefecto;
};

module.exports = {
    // Clave simple de acceso. Se lee al momento de usarla.
    get apiKey() {
        return process.env.API_KEY || '';
    },

    // URLs permitidas para el frontend (CORS). Se pueden poner varias separadas por coma.
    get frontendOrigins() {
        return (process.env.FRONTEND_URL || 'http://localhost:5173')
            .split(',')
            .map((url) => url.trim())
            .filter(Boolean);
    },

    limites: {
        // SON PROVISORIOS: por que el equipo todavía no definió estos números. Se cambian desde el .env.
        get maxResultadosBusqueda() {
            return entero(process.env.MAX_RESULTADOS_BUSQUEDA, 100);
        },
        get maxBusquedasPorDia() {
            return entero(process.env.MAX_BUSQUEDAS_POR_DIA, 20);
        },
        get tokenHoras() {
            return entero(process.env.TOKEN_HORAS, 8);
        },

        // Largos máximos de los textos de la búsqueda. También provisorios.
        largoMaxCiudad: 100,
        largoMaxPais: 100,
        largoMaxRubro: 100,

        // Definido en la tarjeta: una búsqueda de menos de 5 días se reutiliza.
        diasReutilizarBusqueda: 5,
    },
};
