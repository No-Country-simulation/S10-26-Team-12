// DATOS DE MENTIRA para la API V1. Cuando se conecte PostgreSQL (días 10-12) este archivo se reemplaza
// por consultas a Prisma. Los campos son exactamente los del contrato (contrato-lead.json).
const contrato = require('../contrato/contrato-lead.json');

const ESTADOS = contrato.enums.EstadoLead;
const FUENTES = contrato.enums.FuenteResena;

// Lugares y negocios inventados (5 por lugar = 25 leads).
const LUGARES = [
    { pais: 'Colombia', ciudad: 'Medellín', rubro: 'restaurantes', tel: '+57 300 555 01',
      nombres: ['Sabor Paisa', 'El Fogón de Don Luis', 'Casa Antioqueña', 'La Bandeja Express', 'Parrilla El Poblado'] },
    { pais: 'Colombia', ciudad: 'Bogotá', rubro: 'clínicas dentales', tel: '+57 310 555 01',
      nombres: ['Dental Norte', 'Sonrisa Plena', 'Clínica Odontológica Chapinero', 'OdontoVida', 'Dental Express Bogotá'] },
    { pais: 'México', ciudad: 'Ciudad de México', rubro: 'restaurantes', tel: '+52 55 5555 01',
      nombres: ['Tacos El Güero', 'Cantina La Roma', 'Fonda Doña Mary', 'Mariscos El Puerto', 'La Casa del Pozole'] },
    { pais: 'Argentina', ciudad: 'Buenos Aires', rubro: 'peluquerías', tel: '+54 11 5555 01',
      nombres: ['Estilo Palermo', 'Corte & Color', 'Peluquería Don Carlos', 'Hair Studio Belgrano', 'Salón Las Heras'] },
    { pais: 'Chile', ciudad: 'Santiago', rubro: 'talleres mecánicos', tel: '+56 2 5555 01',
      nombres: ['Taller Mecánico Sur', 'AutoService Providencia', 'Mecánica Rápida Ñuñoa', 'Frenos y Más', 'Taller Los Leones'] },
];

// Problemas detectados por la IA. El último (null) representa un lead que todavía no fue analizado.
const PROBLEMAS_EN_ORDEN = ['atencion', 'precios', 'higiene', 'demoras', 'calidad', 'otro', null];

// Textos de ejemplo por problema.
const PLANTILLAS = {
    atencion: {
        tema: 'atención al cliente',
        queja: 'un trato poco amable del personal',
        resumen: 'Varios clientes se quejan del trato del personal y de que nadie responde a sus reclamos.',
        resenas: ['El personal fue muy grosero y nadie quiso ayudarme.', 'Pedí hablar con el encargado y me ignoraron.', 'Mala atención, me hicieron esperar sin dar explicaciones.'],
    },
    precios: {
        tema: 'precios',
        queja: 'precios que no se corresponden con lo que reciben',
        resumen: 'Los clientes consideran que los precios son demasiado altos para la calidad que ofrece el lugar.',
        resenas: ['Carísimo para lo que ofrecen, no vale lo que cobran.', 'Me cobraron de más y no quisieron revisar la cuenta.', 'Los precios subieron y el servicio sigue igual.'],
    },
    higiene: {
        tema: 'higiene del local',
        queja: 'problemas de higiene en el local',
        resumen: 'Se repiten comentarios sobre suciedad en el local y falta de limpieza en los baños y las mesas.',
        resenas: ['El lugar estaba sucio y los baños en mal estado.', 'Vi las mesas sin limpiar durante todo el tiempo que estuve.', 'Falta limpieza, no volvería.'],
    },
    demoras: {
        tema: 'tiempos de espera',
        queja: 'demoras muy largas en el servicio',
        resumen: 'La queja principal son las esperas muy largas, incluso con el local casi vacío.',
        resenas: ['Esperé más de una hora y nunca me explicaron nada.', 'Muy lento todo, perdí la paciencia.', 'Tardaron una eternidad en atendernos.'],
    },
    calidad: {
        tema: 'calidad del servicio',
        queja: 'una calidad por debajo de lo esperado',
        resumen: 'Los clientes dicen que la calidad del producto o servicio no es la que se promociona.',
        resenas: ['La calidad bajó muchísimo desde la última vez.', 'No es lo que muestran en las fotos, quedé decepcionado.', 'Servicio mediocre, esperaba mucho más.'],
    },
    otro: {
        tema: 'experiencia de los clientes',
        queja: 'experiencias negativas variadas',
        resumen: 'Las quejas son variadas y no hay un problema único que se repita.',
        resenas: ['No tuve una buena experiencia en general.', 'Hubo varios detalles que arruinaron la visita.', 'No lo recomiendo.'],
    },
};

const DIA = 24 * 60 * 60 * 1000;
const FECHA_BASE = Date.parse('2026-10-01T12:00:00.000Z');
const iso = (ms) => new Date(ms).toISOString();

// Convierte "Sabor Paisa" en "saborpaisa" para armar un email de ejemplo (dominio .example, no existe).
const slug = (nombre) =>
    nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

function crearLeads() {
    const leads = [];
    let idResena = 1;

    LUGARES.forEach((lugar, iLugar) => {
        lugar.nombres.forEach((nombre, iNombre) => {
            const i = iLugar * 5 + iNombre; // posición global 0..24
            const id = i + 1;
            const estado = ESTADOS[(i * 3) % ESTADOS.length];
            const problema = PROBLEMAS_EN_ORDEN[i % PROBLEMAS_EN_ORDEN.length];
            const plantilla = problema ? PLANTILLAS[problema] : null;
            const creado = FECHA_BASE + i * DIA;
            const fueContactado = estado !== 'nuevo';

            // Reseñas negativas (solo si la IA analizó al lead).
            const resenas = plantilla
                ? plantilla.resenas.map((textoResena, k) => ({
                      id: idResena++,
                      texto: textoResena,
                      rating: 1 + ((i + k) % 3), // 1, 2 o 3
                      fecha: iso(creado - (k + 1) * 3 * DIA),
                      autor: `Cliente ${k + 1}`,
                      fuente: FUENTES[(i + k) % FUENTES.length],
                  }))
                : [];

            leads.push({
                id,
                place_id: `mock_place_${String(id).padStart(3, '0')}`,
                nombre,
                pais: lugar.pais,
                ciudad: lugar.ciudad,
                rubro: lugar.rubro,
                email: i % 3 === 0 ? null : `contacto@${slug(nombre)}.example`,
                telefono: i % 4 === 0 ? null : `${lugar.tel}${String(10 + iNombre).padStart(2, '0')}`,
                estado,
                rating: Math.round((1.5 + ((i * 7) % 20) / 10) * 10) / 10, // entre 1.5 y 3.4
                review_count: 12 + ((i * 53) % 400),
                creado_en: iso(creado),
                ultima_actualizacion: iso(creado + DIA),
                fecha_ultimo_contacto: fueContactado ? iso(creado + 2 * DIA) : null,
                contactado_por: fueContactado ? 1 : null,
                problema,
                problema_resumen: plantilla ? plantilla.resumen : null,
                asunto_mail: plantilla ? `${nombre}: una oportunidad de mejora en ${plantilla.tema}` : null,
                contenido_mail: plantilla
                    ? `Hola, equipo de ${nombre}. Revisamos las reseñas recientes de su negocio en ${lugar.ciudad} y notamos que varios clientes mencionan ${plantilla.queja}. Sabemos que una mala racha en internet puede alejar a nuevos clientes aunque el servicio mejore. En RepuSense ayudamos a negocios como el suyo a responder esas opiniones, recuperar su reputación y volver a atraer clientes. Nos gustaría mostrarles cómo funciona en una llamada breve.`
                    : null,
                resenas, // se usa solo en el detalle (GET /leads/:id); en las listas se saca
            });
        });
    });

    return leads;
}

// Lista en memoria: los cambios (ej. PATCH del estado) duran hasta que se reinicia el servidor.
const leads = crearLeads();

module.exports = { leads, crearLeads };
