// Documentación Swagger (OpenAPI 3.0) de la API V1. Se ve en /api/docs.
// Los enums salen del contrato, así Swagger siempre coincide con la API.
const contrato = require('../contrato/contrato-lead.json');
const { limites } = require('../config/api.config');

const { EstadoLead, FuenteResena, Problema } = contrato.enums;
 
const ejemploResena = {
    id: 1,
    texto: 'El personal fue muy grosero y nadie quiso ayudarme.',
    rating: 1,
    fecha: '2026-10-17T12:00:00.000Z',
    autor: 'Cliente 1',
    fuente: 'google_maps',
};

const ejemploLead = {
    id: 2,
    place_id: 'mock_place_002',
    nombre: 'El Fogón de Don Luis',
    pais: 'Colombia',
    ciudad: 'Medellín',
    rubro: 'restaurantes',
    email: 'contacto@elfogondedonluis.example',
    telefono: '+57 300 555 0111',
    estado: 'nuevo',
    rating: 2.1,
    review_count: 65,
    creado_en: '2026-10-21T12:00:00.000Z',
    ultima_actualizacion: '2026-10-22T12:00:00.000Z',
    fecha_ultimo_contacto: null,
    contactado_por: null,
    problema: 'precios',
    problema_resumen: 'Los clientes consideran que los precios son demasiado altos para la calidad que ofrece el lugar.',
    asunto_mail: 'El Fogón de Don Luis: una oportunidad de mejora en precios',
    contenido_mail: 'Hola, equipo de El Fogón de Don Luis. Revisamos las reseñas recientes de su negocio en Medellín y notamos que varios clientes mencionan precios que no se corresponden con lo que reciben...',
};

const ejemploPaginacion = { page: 1, limit: 20, total: 25, totalPages: 2 };
const ejemploError422 = {
    status: 'error',
    message: 'Datos inválidos. ciudad: ciudad no puede estar vacío',
    errors: [{ campo: 'ciudad', mensaje: 'ciudad no puede estar vacío' }],
};

// Piezas reutilizables 
const ref = (nombre) => ({ $ref: `#/components/schemas/${nombre}` });

const respuesta = (descripcion, schema, example) => ({
    description: descripcion,
    content: { 'application/json': { schema, example } },
});

const r401 = respuesta('Token faltante, inválido o vencido', ref('RespuestaError'), {
    status: 'error',
    message: 'Token faltante, inválido o vencido. Iniciá sesión en POST /api/auth/login',
});
const r404 = (mensaje) => respuesta('No encontrado', ref('RespuestaError'), { status: 'error', message: mensaje });
const r422 = (ejemplo = ejemploError422) => respuesta('Datos inválidos', ref('RespuestaError'), ejemplo);

const exitoDe = (schema) => ({
    type: 'object',
    properties: { status: { type: 'string', example: 'success' }, data: schema },
});

const parametroId = {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'integer', minimum: 1 },
    example: 2,
};

const seguridad = [{ bearerAuth: [] }];

// Filtros compartidos por /leads y /leads/export
const filtros = [
    { name: 'pais', in: 'query', schema: { type: 'string', maxLength: limites.largoMaxPais }, example: 'Colombia' },
    { name: 'ciudad', in: 'query', schema: { type: 'string', maxLength: limites.largoMaxCiudad }, example: 'Medellín' },
    { name: 'problema', in: 'query', schema: ref('Problema'), example: 'precios' },
    { name: 'estado', in: 'query', schema: ref('EstadoLead'), example: 'nuevo' },
    { name: 'rating_min', in: 'query', schema: { type: 'number', minimum: 0, maximum: 5 }, example: 1.5 },
    { name: 'rating_max', in: 'query', schema: { type: 'number', minimum: 0, maximum: 5 }, example: 3.4 },
];

module.exports = {
    openapi: '3.0.3',
    info: {
        title: 'RepuSense API',
        version: '1.0.0',
        description:
            'API V1 de RepuSense con **datos de mentira (mock)**. Para probar: hacé `POST /auth/login` con la clave, ' +
            'copiá el token y apretá **Authorize**. Errores de validación: 422. Sin token: 401.',
    },
    servers: [{ url: '/api' }],
    tags: [
        { name: 'Sistema' },
        { name: 'Auth' },
        { name: 'Búsquedas' },
        { name: 'Leads' },
    ],
    paths: {
        '/health': {
            get: {
                tags: ['Sistema'],
                summary: 'Estado del backend y de la base de datos (público)',
                responses: {
                    200: respuesta('Todo funciona', { type: 'object' }, {
                        status: 'ok',
                        message: 'Backend y base de datos funcionando correctamente',
                        timestamp: '2026-11-08T12:00:00.000Z',
                        uptimeSeconds: 120.5,
                        database: { status: 'up', name: 'repusense_db', latencyMs: 3 },
                    }),
                    503: respuesta('La base de datos no responde', { type: 'object' }, {
                        status: 'error',
                        message: 'Backend activo, pero la base de datos no responde',
                        database: { status: 'down', latencyMs: 5001 },
                    }),
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Iniciar sesión con la clave simple (API_KEY)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['clave'],
                                properties: { clave: { type: 'string', maxLength: 200 } },
                            },
                            example: { clave: 'la-clave-del-env' },
                        },
                    },
                },
                responses: {
                    200: respuesta('Login correcto', exitoDe({ type: 'object' }), {
                        status: 'success',
                        data: { token: 'eyJleHAiOjE3...firma', tipo: 'Bearer', expira_en_horas: 8 },
                    }),
                    401: respuesta('Clave incorrecta', ref('RespuestaError'), { status: 'error', message: 'Clave incorrecta' }),
                    422: r422({
                        status: 'error',
                        message: 'Datos inválidos. clave: clave es obligatorio',
                        errors: [{ campo: 'clave', mensaje: 'clave es obligatorio' }],
                    }),
                },
            },
        },
        '/busquedas': {
            post: {
                tags: ['Búsquedas'],
                summary: 'Lanzar una búsqueda (reutiliza una de menos de 5 días salvo que se fuerce)',
                security: seguridad,
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/BusquedaRequest' },
                            examples: {
                                simple: { summary: 'Búsqueda normal', value: { ciudad: 'Medellín', pais: 'Colombia', rubro: 'restaurantes' } },
                                forzada: { summary: 'Forzar una nueva corrida', value: { ciudad: 'Medellín', pais: 'Colombia', rubro: 'restaurantes', forzar: true, max_resultados: 50 } },
                            },
                        },
                    },
                },
                responses: {
                    200: respuesta('Había una búsqueda reciente: se reutiliza', exitoDe(ref('BusquedaCreada')), {
                        status: 'success',
                        data: { id: 1, reutilizada: true, ultima_corrida: '2026-11-06T12:00:00.000Z', max_resultados: limites.maxResultadosBusqueda },
                    }),
                    201: respuesta('Se lanzó una búsqueda nueva', exitoDe(ref('BusquedaCreada')), {
                        status: 'success',
                        data: { id: 4, reutilizada: false, ultima_corrida: '2026-11-08T12:00:00.000Z', max_resultados: limites.maxResultadosBusqueda },
                    }),
                    401: r401,
                    422: r422(),
                    429: respuesta('Se superó el tope de búsquedas por día', ref('RespuestaError'), {
                        status: 'error',
                        message: `Se alcanzó el máximo de ${limites.maxBusquedasPorDia} búsquedas por día. Probá de nuevo mañana.`,
                    }),
                },
            },
        },
        '/busquedas/{id}': {
            get: {
                tags: ['Búsquedas'],
                summary: 'Consultar una búsqueda',
                security: seguridad,
                parameters: [parametroId],
                responses: {
                    200: respuesta('Datos de la búsqueda', exitoDe(ref('Busqueda')), {
                        status: 'success',
                        data: { id: 1, ciudad: 'Medellín', pais: 'Colombia', rubro: 'restaurantes', ultima_corrida: '2026-11-06T12:00:00.000Z', total_leads: 5 },
                    }),
                    401: r401,
                    404: r404('No existe la búsqueda con id 99'),
                    422: r422({ status: 'error', message: 'Datos inválidos. id: El id debe ser un número entero positivo', errors: [{ campo: 'id', mensaje: 'El id debe ser un número entero positivo' }] }),
                },
            },
        },
        '/leads': {
            get: {
                tags: ['Leads'],
                summary: 'Listar leads con filtros y paginación',
                security: seguridad,
                parameters: [
                    ...filtros,
                    { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 }, example: 1 },
                    { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }, example: 20 },
                ],
                responses: {
                    200: respuesta('Lista paginada', {
                        type: 'object',
                        properties: {
                            status: { type: 'string', example: 'success' },
                            data: { type: 'array', items: ref('Lead') },
                            pagination: ref('Paginacion'),
                        },
                    }, { status: 'success', data: [ejemploLead], pagination: ejemploPaginacion }),
                    401: r401,
                    422: r422({
                        status: 'error',
                        message: 'Datos inválidos. estado: estado inválido. Valores permitidos: ' + EstadoLead.join(', '),
                        errors: [{ campo: 'estado', mensaje: 'estado inválido. Valores permitidos: ' + EstadoLead.join(', ') }],
                    }),
                },
            },
        },
        '/leads/export': {
            get: {
                tags: ['Leads'],
                summary: 'Exportar leads a CSV (mismos filtros que /leads, sin paginación)',
                security: seguridad,
                parameters: filtros,
                responses: {
                    200: {
                        description: 'Archivo CSV',
                        content: {
                            'text/csv': {
                                schema: { type: 'string' },
                                example: 'nombre,ciudad,rating,problema,problema_resumen,estado,email,telefono\r\nEl Fogón de Don Luis,Medellín,2.1,precios,Los clientes consideran que los precios son demasiado altos...,nuevo,contacto@elfogondedonluis.example,+57 300 555 0111\r\n',
                            },
                        },
                    },
                    401: r401,
                    422: r422(),
                },
            },
        },
        '/leads/{id}': {
            get: {
                tags: ['Leads'],
                summary: 'Detalle de un lead (incluye reseñas negativas)',
                security: seguridad,
                parameters: [parametroId],
                responses: {
                    200: respuesta('Detalle del lead', exitoDe(ref('LeadDetalle')), {
                        status: 'success',
                        data: { ...ejemploLead, resenas: [ejemploResena] },
                    }),
                    401: r401,
                    404: r404('No existe el lead con id 999'),
                    422: r422({ status: 'error', message: 'Datos inválidos. id: El id debe ser un número entero positivo', errors: [{ campo: 'id', mensaje: 'El id debe ser un número entero positivo' }] }),
                },
            },
        },
        '/leads/{id}/draft': {
            get: {
                tags: ['Leads'],
                summary: 'Borrador del correo en frío generado por IA',
                security: seguridad,
                parameters: [parametroId],
                responses: {
                    200: respuesta('Borrador', exitoDe(ref('Draft')), {
                        status: 'success',
                        data: {
                            id: 2,
                            nombre: ejemploLead.nombre,
                            asunto_mail: ejemploLead.asunto_mail,
                            contenido_mail: ejemploLead.contenido_mail,
                        },
                    }),
                    401: r401,
                    404: r404('Este lead todavía no tiene un borrador de correo generado'),
                    422: r422({ status: 'error', message: 'Datos inválidos. id: El id debe ser un número entero positivo', errors: [{ campo: 'id', mensaje: 'El id debe ser un número entero positivo' }] }),
                },
            },
        },
        '/leads/{id}/estado': {
            patch: {
                tags: ['Leads'],
                summary: 'Cambiar el estado de un lead (solo los 7 estados válidos)',
                security: seguridad,
                parameters: [parametroId],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { type: 'object', required: ['estado'], properties: { estado: ref('EstadoLead') } },
                            example: { estado: 'contactado' },
                        },
                    },
                },
                responses: {
                    200: respuesta('Lead actualizado', exitoDe(ref('Lead')), {
                        status: 'success',
                        data: { ...ejemploLead, estado: 'contactado' },
                    }),
                    401: r401,
                    404: r404('No existe el lead con id 999'),
                    422: r422({
                        status: 'error',
                        message: 'Datos inválidos. estado: estado inválido. Valores permitidos: ' + EstadoLead.join(', '),
                        errors: [{ campo: 'estado', mensaje: 'estado inválido. Valores permitidos: ' + EstadoLead.join(', ') }],
                    }),
                },
            },
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', description: 'Token que devuelve POST /auth/login' },
        },
        schemas: {
            EstadoLead: { type: 'string', enum: EstadoLead, example: 'nuevo' },
            Problema: { type: 'string', enum: Problema, example: 'precios' },
            FuenteResena: { type: 'string', enum: FuenteResena, example: 'google_maps' },
            Resena: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    texto: { type: 'string' },
                    rating: { type: 'number' },
                    fecha: { type: 'string', format: 'date-time' },
                    autor: { type: 'string', nullable: true },
                    fuente: ref('FuenteResena'),
                },
                example: ejemploResena,
            },
            Lead: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    place_id: { type: 'string' },
                    nombre: { type: 'string' },
                    pais: { type: 'string' },
                    ciudad: { type: 'string' },
                    rubro: { type: 'string' },
                    email: { type: 'string', nullable: true },
                    telefono: { type: 'string', nullable: true },
                    estado: ref('EstadoLead'),
                    rating: { type: 'number' },
                    review_count: { type: 'integer' },
                    creado_en: { type: 'string', format: 'date-time' },
                    ultima_actualizacion: { type: 'string', format: 'date-time' },
                    fecha_ultimo_contacto: { type: 'string', format: 'date-time', nullable: true },
                    contactado_por: { type: 'integer', nullable: true },
                    problema: { type: 'string', enum: Problema, nullable: true },
                    problema_resumen: { type: 'string', nullable: true },
                    asunto_mail: { type: 'string', nullable: true },
                    contenido_mail: { type: 'string', nullable: true },
                },
                example: ejemploLead,
            },
            LeadDetalle: {
                allOf: [ref('Lead'), { type: 'object', properties: { resenas: { type: 'array', items: ref('Resena') } } }],
            },
            Draft: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    nombre: { type: 'string' },
                    asunto_mail: { type: 'string' },
                    contenido_mail: { type: 'string' },
                },
            },
            BusquedaRequest: {
                type: 'object',
                required: ['ciudad', 'pais', 'rubro'],
                properties: {
                    ciudad: { type: 'string', maxLength: limites.largoMaxCiudad },
                    pais: { type: 'string', maxLength: limites.largoMaxPais },
                    rubro: { type: 'string', maxLength: limites.largoMaxRubro },
                    forzar: { type: 'boolean', default: false, description: 'true = ignorar la regla de reutilizar búsquedas de menos de 5 días' },
                    max_resultados: { type: 'integer', minimum: 1, maximum: limites.maxResultadosBusqueda, description: 'Tope de resultados de esta búsqueda' },
                },
            },
            BusquedaCreada: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    reutilizada: { type: 'boolean' },
                    ultima_corrida: { type: 'string', format: 'date-time' },
                    max_resultados: { type: 'integer' },
                },
            },
            Busqueda: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    ciudad: { type: 'string' },
                    pais: { type: 'string' },
                    rubro: { type: 'string' },
                    ultima_corrida: { type: 'string', format: 'date-time', nullable: true },
                    total_leads: { type: 'integer' },
                },
            },
            Paginacion: {
                type: 'object',
                properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                },
                example: ejemploPaginacion,
            },
            RespuestaError: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string' },
                    errors: {
                        type: 'array',
                        items: { type: 'object', properties: { campo: { type: 'string' }, mensaje: { type: 'string' } } },
                    },
                },
            },
        },
    },
};
