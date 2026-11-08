// DATOS DE MENTIRA de búsquedas. Imitan la tabla "busquedas" (search_key única, ultima_corrida).
const { crearSearchKey } = require('../utils/texto');

const DIA = 24 * 60 * 60 * 1000;
const hace = (dias) => new Date(Date.now() - dias * DIA).toISOString();

const semillas = [
    { ciudad: 'Medellín', pais: 'Colombia', rubro: 'restaurantes', ultima_corrida: hace(2) }, // reciente: se reutiliza
    { ciudad: 'Ciudad de México', pais: 'México', rubro: 'restaurantes', ultima_corrida: hace(10) }, // vieja: se vuelve a correr
    { ciudad: 'Bogotá', pais: 'Colombia', rubro: 'clínicas dentales', ultima_corrida: hace(1) },
];

const busquedas = semillas.map((b, i) => ({ id: i + 1, search_key: crearSearchKey(b), ...b }));

// Fechas de las corridas NUEVAS lanzadas en este servidor (sirve para el tope de búsquedas por día).
const corridas = [];

let ultimoId = busquedas.length;
const nuevoId = () => ++ultimoId;

module.exports = { busquedas, corridas, nuevoId };
