const express = require('express');
const cors = require('cors');
require('dotenv').config({ quiet: true });

const apiRoutes = require('./routes');
const { pool } = require('./config/database');
const config = require('./config/api.config');

const app = express();

// Middlewares
app.disable('x-powered-by');

// CORS: solo se permite el frontend (variable FRONTEND_URL, por defecto el de Vite en desarrollo).
app.use(
    cors({
        origin: config.frontendOrigins,
        methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Disposition'], // para que el frontend lea el nombre del CSV
    }),
);
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
    // JSON mal formado en el body: es un error del cliente (400), no del servidor.
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            status: 'error',
            message: 'El cuerpo de la petición no es un JSON válido',
        });
    }
    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            status: 'error',
            message: 'El cuerpo de la petición es demasiado grande',
        });
    }

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

    if (!config.apiKey) {
        console.warn('AVISO: falta la variable API_KEY. El login va a responder 500 hasta que se configure.');
    }

    const server = app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
        console.log(`Swagger: http://localhost:${PORT}/api/docs`);
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

