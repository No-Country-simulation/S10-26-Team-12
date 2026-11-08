// Tests de la API V1 (tarjeta E). Se corren con: npm test
// Usan el fetch que trae Node y levantan el servidor en un puerto libre; no necesitan base de datos.
process.env.API_KEY = 'clave-de-test';
process.env.MAX_BUSQUEDAS_POR_DIA = '4';
process.env.MAX_RESULTADOS_BUSQUEDA = '100';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const app = require('../src/app');
const { pool } = require('../src/config/database');
const contrato = require('../src/contrato/contrato-lead.json');
const { leads } = require('../src/mock/leads.mock');
const { celda } = require('../src/utils/csv');

let server;
let base;
let token;

// Helper: hace una petición y devuelve { status, body, headers }.
async function pedir(metodo, ruta, { body, auth = true, texto } = {}) {
    const headers = {};
    if (auth) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined || texto !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${base}/api${ruta}`, {
        method: metodo,
        headers,
        body: texto !== undefined ? texto : body !== undefined ? JSON.stringify(body) : undefined,
    });
    const contentType = res.headers.get('content-type') || '';
    const cuerpo = contentType.includes('json') ? await res.json() : await res.text();
    return { status: res.status, body: cuerpo, headers: res.headers };
}

before(async () => {
    server = app.listen(0);
    base = `http://127.0.0.1:${server.address().port}`;
    const login = await pedir('POST', '/auth/login', { body: { clave: 'clave-de-test' }, auth: false });
    token = login.body.data.token;
});

after(async () => {
    server.close();
    await pool.end();
});

// ---------- Criterio 10 y 4: protección con clave simple ----------
test('login: sin clave -> 422, clave mala -> 401, clave buena -> token', async () => {
    assert.equal((await pedir('POST', '/auth/login', { body: {}, auth: false })).status, 422);
    assert.equal((await pedir('POST', '/auth/login', { body: { clave: 'mala' }, auth: false })).status, 401);
    const ok = await pedir('POST', '/auth/login', { body: { clave: 'clave-de-test' }, auth: false });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.status, 'success');
    assert.ok(ok.body.data.token);
});

test('rutas protegidas sin token (o con token falso) -> 401', async () => {
    for (const [metodo, ruta] of [['GET', '/leads'], ['GET', '/leads/1'], ['GET', '/leads/export'], ['POST', '/busquedas'], ['GET', '/busquedas/1']]) {
        const r = await pedir(metodo, ruta, { auth: false });
        assert.equal(r.status, 401, `${metodo} ${ruta}`);
        assert.equal(r.body.status, 'error');
    }
    const falso = await fetch(`${base}/api/leads`, { headers: { Authorization: 'Bearer abc.def' } });
    assert.equal(falso.status, 401);
});

test('health y docs son públicos (no piden token)', async () => {
    const health = await pedir('GET', '/health', { auth: false });
    assert.notEqual(health.status, 401); // 200 con base, 503 sin base
    const docs = await pedir('GET', '/docs.json', { auth: false });
    assert.equal(docs.status, 200);
});

// ---------- Criterio 3: GET /leads con filtros y paginación ----------
test('GET /leads: paginación y formato estándar', async () => {
    const r = await pedir('GET', '/leads?page=2&limit=10');
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'success');
    assert.equal(r.body.data.length, 10);
    assert.deepEqual(r.body.pagination, { page: 2, limit: 10, total: 25, totalPages: 3 });
    assert.equal('resenas' in r.body.data[0], false); // en la lista no van las reseñas
});

test('GET /leads: filtros por pais, ciudad (sin importar tildes), rating, problema y estado', async () => {
    const porPais = await pedir('GET', '/leads?pais=colombia&limit=100');
    assert.equal(porPais.body.pagination.total, 10);

    const porCiudad = await pedir('GET', '/leads?ciudad=medellin&limit=100');
    assert.equal(porCiudad.body.pagination.total, 5);
    assert.ok(porCiudad.body.data.every((l) => l.ciudad === 'Medellín'));

    const porRating = await pedir('GET', '/leads?rating_min=2&rating_max=3&limit=100');
    assert.ok(porRating.body.data.length > 0);
    assert.ok(porRating.body.data.every((l) => l.rating >= 2 && l.rating <= 3));

    const porProblema = await pedir('GET', '/leads?problema=higiene&limit=100');
    assert.ok(porProblema.body.data.length > 0);
    assert.ok(porProblema.body.data.every((l) => l.problema === 'higiene'));

    const porEstado = await pedir('GET', '/leads?estado=no_responde&limit=100');
    assert.ok(porEstado.body.data.length > 0);
    assert.ok(porEstado.body.data.every((l) => l.estado === 'no_responde'));

    const combinado = await pedir('GET', '/leads?pais=Colombia&estado=nuevo&limit=100');
    assert.ok(combinado.body.data.every((l) => l.pais === 'Colombia' && l.estado === 'nuevo'));
});

test('GET /leads: parámetros inválidos -> 422 con mensaje claro', async () => {
    for (const query of ['limit=1000', 'page=0', 'estado=inventado', 'problema=xyz', 'rating_min=abc', 'rating_min=4&rating_max=2']) {
        const r = await pedir('GET', `/leads?${query}`);
        assert.equal(r.status, 422, query);
        assert.equal(r.body.status, 'error');
        assert.ok(r.body.errors.length > 0 && r.body.errors[0].mensaje, query);
    }
});

// ---------- Detalle y draft ----------
test('GET /leads/:id: detalle con reseñas, 404 y 422', async () => {
    const r = await pedir('GET', '/leads/2');
    assert.equal(r.status, 200);
    assert.equal(r.body.data.id, 2);
    assert.ok(Array.isArray(r.body.data.resenas));

    assert.equal((await pedir('GET', '/leads/9999')).status, 404);
    assert.equal((await pedir('GET', '/leads/abc')).status, 422);
    assert.equal((await pedir('GET', '/leads/-1')).status, 422);
});

test('GET /leads/:id/draft: devuelve el borrador; 404 si no hay', async () => {
    const r = await pedir('GET', '/leads/1/draft');
    assert.equal(r.status, 200);
    assert.ok(r.body.data.asunto_mail && r.body.data.contenido_mail);

    const sinAnalisis = leads.find((l) => l.problema === null);
    assert.equal((await pedir('GET', `/leads/${sinAnalisis.id}/draft`)).status, 404);
    assert.equal((await pedir('GET', '/leads/abc/draft')).status, 422);
});

// ---------- Criterios 5 y 6: PATCH estado ----------
test('PATCH /leads/:id/estado: acepta los 7 estados', async () => {
    for (const estado of contrato.enums.EstadoLead) {
        const r = await pedir('PATCH', '/leads/3/estado', { body: { estado } });
        assert.equal(r.status, 200, estado);
        assert.equal(r.body.data.estado, estado);
    }
    const lectura = await pedir('GET', '/leads/3');
    assert.equal(lectura.body.data.estado, 'descartado'); // el último que se mandó
});

test('PATCH /leads/:id/estado: estado inválido, faltante o body roto -> 422', async () => {
    const invalido = await pedir('PATCH', '/leads/3/estado', { body: { estado: 'no responde' } });
    assert.equal(invalido.status, 422);
    assert.match(invalido.body.message, /Valores permitidos/);

    assert.equal((await pedir('PATCH', '/leads/3/estado', { body: {} })).status, 422);
    assert.equal((await pedir('PATCH', '/leads/3/estado', { body: { estado: 5 } })).status, 422);
    assert.equal((await pedir('PATCH', '/leads/3/estado', { auth: true })).status, 422); // sin body
    assert.equal((await pedir('PATCH', '/leads/9999/estado', { body: { estado: 'nuevo' } })).status, 404);
    assert.equal((await pedir('PATCH', '/leads/3/estado', { body: { estado: 'nuevo' }, auth: false })).status, 401);
});

// ---------- Criterios 1 y 9: POST /busquedas ----------
test('POST /busquedas: rechaza campos vacíos, faltantes o demasiado largos (422)', async () => {
    const casos = [
        { pais: 'Colombia', rubro: 'restaurantes' },
        { ciudad: '', pais: 'Colombia', rubro: 'restaurantes' },
        { ciudad: '   ', pais: 'Colombia', rubro: 'restaurantes' },
        { ciudad: 'Medellín', pais: '', rubro: 'restaurantes' },
        { ciudad: 'Medellín', pais: 'Colombia', rubro: '' },
        { ciudad: 123, pais: 'Colombia', rubro: 'restaurantes' },
        { ciudad: 'a'.repeat(101), pais: 'Colombia', rubro: 'restaurantes' },
        { ciudad: 'Medellín', pais: 'Colombia', rubro: 'restaurantes', forzar: 'si' },
        { ciudad: 'Medellín', pais: 'Colombia', rubro: 'restaurantes', max_resultados: 101 },
        { ciudad: 'Medellín', pais: 'Colombia', rubro: 'restaurantes', max_resultados: 0 },
    ];
    for (const body of casos) {
        const r = await pedir('POST', '/busquedas', { body });
        assert.equal(r.status, 422, JSON.stringify(body));
        assert.ok(r.body.errors[0].campo && r.body.errors[0].mensaje);
    }
});

test('POST /busquedas: reutiliza una búsqueda de menos de 5 días', async () => {
    // Variantes con tildes/mayúsculas cuentan como la misma búsqueda.
    const r = await pedir('POST', '/busquedas', { body: { ciudad: 'MEDELLIN', pais: 'colombia', rubro: 'Restaurantes' } });
    assert.equal(r.status, 200);
    assert.equal(r.body.data.id, 1);
    assert.equal(r.body.data.reutilizada, true);
});

test('POST /busquedas: una búsqueda vieja (10 días) se vuelve a correr', async () => {
    const r = await pedir('POST', '/busquedas', { body: { ciudad: 'Ciudad de México', pais: 'México', rubro: 'restaurantes' } });
    assert.equal(r.status, 201);
    assert.equal(r.body.data.id, 2); // mismo registro (search_key única), solo cambia la fecha
    assert.equal(r.body.data.reutilizada, false);
});

test('POST /busquedas: "forzar" ignora la regla de los 5 días', async () => {
    const r = await pedir('POST', '/busquedas', { body: { ciudad: 'Medellín', pais: 'Colombia', rubro: 'restaurantes', forzar: true } });
    assert.equal(r.status, 201);
    assert.equal(r.body.data.id, 1);
    assert.equal(r.body.data.reutilizada, false);
});

test('POST /busquedas: respeta el tope de búsquedas por día (429)', async () => {
    let primer429 = null;
    let creadas = 0;
    for (let i = 0; i < 10; i++) {
        const r = await pedir('POST', '/busquedas', { body: { ciudad: 'Lima', pais: 'Perú', rubro: `rubro-${i}` } });
        if (r.status === 429) { primer429 = r; break; }
        assert.equal(r.status, 201);
        creadas++;
    }
    assert.ok(primer429, 'tiene que aparecer un 429');
    assert.equal(primer429.body.status, 'error');
    assert.ok(creadas <= 4);
});

test('GET /busquedas/:id: datos, 404 y 422', async () => {
    const r = await pedir('GET', '/busquedas/1');
    assert.equal(r.status, 200);
    assert.equal(r.body.data.ciudad, 'Medellín');
    assert.equal(r.body.data.total_leads, 5);
    assert.equal((await pedir('GET', '/busquedas/9999')).status, 404);
    assert.equal((await pedir('GET', '/busquedas/xyz')).status, 422);
});

// ---------- Export CSV ----------
test('GET /leads/export: devuelve CSV y respeta los filtros', async () => {
    const r = await pedir('GET', '/leads/export?ciudad=Medellín');
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /text\/csv/);
    assert.match(r.headers.get('content-disposition'), /attachment; filename="leads-\d{4}-\d{2}-\d{2}\.csv"/);

    const lineas = r.body.replace('\uFEFF', '').trim().split('\r\n');
    assert.equal(lineas[0], 'nombre,ciudad,rating,problema,problema_resumen,estado,email,telefono');
    assert.equal(lineas.length, 1 + 5); // encabezado + 5 leads de Medellín

    assert.equal((await pedir('GET', '/leads/export?estado=raro')).status, 422);
});

test('CSV: escapa comas, comillas y fórmulas de Excel', () => {
    assert.equal(celda('hola, mundo'), '"hola, mundo"');
    assert.equal(celda('dijo "hola"'), '"dijo ""hola"""');
    assert.equal(celda('=SUMA(A1)'), "'=SUMA(A1)");
    assert.equal(celda('+1+1'), "'+1+1");
    assert.equal(celda('+56 2 5555 0113'), '+56 2 5555 0113'); // un teléfono normal no se modifica
    assert.equal(celda(null), '');
    assert.equal(celda(2.5), '2.5');
});

// ---------- Criterio 7: contrato ----------
test('los leads mock tienen exactamente los campos del contrato y enums válidos', () => {
    const camposContrato = Object.keys(contrato.Lead).sort();
    for (const lead of leads) {
        const { resenas, ...campos } = lead;
        assert.deepEqual(Object.keys(campos).sort(), camposContrato, `lead ${lead.id}`);
        assert.ok(contrato.enums.EstadoLead.includes(lead.estado));
        assert.ok(lead.problema === null || contrato.enums.Problema.includes(lead.problema));
        for (const resena of resenas) {
            assert.deepEqual(Object.keys(resena).sort(), Object.keys(contrato.Resena).sort());
            assert.ok(contrato.enums.FuenteResena.includes(resena.fuente));
        }
    }
});

// ---------- Criterio 8: Swagger ----------
test('Swagger documenta los 9 endpoints con ejemplos', async () => {
    const docs = (await pedir('GET', '/docs.json', { auth: false })).body;
    const esperados = [
        ['/auth/login', 'post'], ['/busquedas', 'post'], ['/busquedas/{id}', 'get'],
        ['/leads', 'get'], ['/leads/{id}', 'get'], ['/leads/{id}/draft', 'get'],
        ['/leads/{id}/estado', 'patch'], ['/leads/export', 'get'], ['/health', 'get'],
    ];
    for (const [ruta, metodo] of esperados) {
        const operacion = docs.paths[ruta]?.[metodo];
        assert.ok(operacion, `falta ${metodo} ${ruta}`);
        const algunaConEjemplo = Object.values(operacion.responses).some((resp) =>
            Object.values(resp.content || {}).some((c) => c.example !== undefined));
        assert.ok(algunaConEjemplo, `sin ejemplos en ${metodo} ${ruta}`);
    }
    const pagina = await fetch(`${base}/api/docs/`);
    assert.equal(pagina.status, 200);
});

// ---------- Errores generales ----------
test('JSON mal formado -> 400 y ruta inexistente -> 404, ambos con formato estándar', async () => {
    const roto = await pedir('POST', '/auth/login', { texto: '{"clave": ', auth: false });
    assert.equal(roto.status, 400);
    assert.equal(roto.body.status, 'error');

    const noExiste = await pedir('GET', '/no-existe', { auth: false });
    assert.equal(noExiste.status, 404);
    assert.equal(noExiste.body.status, 'error');
});
