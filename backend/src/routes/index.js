const express = require('express');
const swaggerUi = require('swagger-ui-express');

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const busquedasRoutes = require('./busquedas.routes');
const leadsRoutes = require('./leads.routes');
const { requiereToken } = require('../middlewares/auth');
const openapi = require('../docs/openapi');

const router = express.Router();

// --- Rutas públicas (no piden token) ---
router.use(healthRoutes); // GET /api/health
router.use('/auth', authRoutes); // POST /api/auth/login

// Swagger: documentación en /api/docs y el JSON crudo en /api/docs.json
router.get('/docs.json', (req, res) => res.json(openapi));
router.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'RepuSense API' }));

// --- Rutas protegidas: sin token válido responden 401 ---
router.use('/busquedas', requiereToken, busquedasRoutes);
router.use('/leads', requiereToken, leadsRoutes);

module.exports = router;
