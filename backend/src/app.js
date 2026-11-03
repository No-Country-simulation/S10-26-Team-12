const express = require('express');
const cors = require('cors');
require('dotenv').config({ quiet: true });

const apiRoutes = require('./routes');
const { pool } = require('./config/database');

const app = express();

// Middlewares
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Rutas de la API
app.use('/api', apiRoutes);

// 404 en JSON para cualquier ruta no registrada
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    });
});

// Manejador global de errores
app.use((error, req, res, next) => {
    console.error('Error no controlado:', error);

    res.status(error.status || 500).json({
        status: 'error',
        message: 'Error interno del servidor',
    });
});

// Solo se levanta el servidor cuando el archivo se ejecuta directamente.
// Al importarlo desde los tests se obtiene la app sin abrir un puerto.
if (require.main === module) {
    const PORT = Number(process.env.PORT) || 5000;

    const server = app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    const shutdown = (signal) => {
        console.log(`${signal} recibido. Cerrando servidor...`);

        server.close(() => {
            pool.end()
                .catch((error) => console.error('Error al cerrar PostgreSQL:', error.message))
                .finally(() => process.exit(0));
        });

        setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
