const express = require('express');
const { checkConnection } = require('../config/database');

const router = express.Router();

/**
 * GET /api/health
 * Endpoint de testeo: verifica que la API responda y que PostgreSQL esté disponible.
 * Devuelve 200 si todo funciona y 503 si la base de datos no responde.
 */
router.get('/health', async (req, res) => {
    const startedAt = Date.now();

    try {
        const { database, latencyMs } = await checkConnection();

        res.status(200).json({
            status: 'ok',
            message: 'Backend y base de datos funcionando correctamente',
            timestamp: new Date().toISOString(),
            uptimeSeconds: Number(process.uptime().toFixed(2)),
            database: {
                status: 'up',
                name: database,
                latencyMs,
            },
        });
    } catch (error) {
        console.error('Health check: la base de datos no responde:', error.message);

        res.status(503).json({
            status: 'error',
            message: 'Backend activo, pero la base de datos no responde',
            timestamp: new Date().toISOString(),
            uptimeSeconds: Number(process.uptime().toFixed(2)),
            database: {
                status: 'down',
                latencyMs: Date.now() - startedAt,
            },
        });
    }
});

module.exports = router;
