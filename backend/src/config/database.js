const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'repusense_db',
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
});

pool.on('error', (error) => {
    console.error('Error inesperado en el pool de PostgreSQL:', error.message);
});

/**
 * Comprueba que PostgreSQL responda y devuelve la base activa junto con la latencia.
 * Se usa desde el endpoint de health para no reportar un estado falso positivo.
 */
async function checkConnection() {
    const startedAt = Date.now();
    const result = await pool.query('SELECT current_database() AS database');

    return {
        database: result.rows[0].database,
        latencyMs: Date.now() - startedAt,
    };
}

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    checkConnection,
};
