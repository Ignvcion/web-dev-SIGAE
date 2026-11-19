const express = require('express');
const { validarIdsNumericos } = require('../middleware/validarIds');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { getEspecialidades } = require('../controllers/especialidadController');

const router = express.Router();
validarIdsNumericos(router); // 400 si un :id no es numérico (ver middleware/validarIds.js)

router.get('/', verifyToken, verifyAdmin, getEspecialidades);

module.exports = router;
