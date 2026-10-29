// TODO: Revisar
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const app = require('../src/app');
const { pool } = require('../src/config/database');

let server;
let baseUrl;

before(async () => {
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));

    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
    await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    });
    await pool.end();
});

test('GET /api/health responde 200 y verifica PostgreSQL', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.database.status, 'up');
    assert.equal(typeof body.database.latencyMs, 'number');
    assert.equal(typeof body.timestamp, 'string');
});

test('Una ruta inexistente responde 404 en JSON', async () => {
    const response = await fetch(`${baseUrl}/api/no-existe`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.status, 'error');
    assert.match(body.message, /Ruta no encontrada/);
});
