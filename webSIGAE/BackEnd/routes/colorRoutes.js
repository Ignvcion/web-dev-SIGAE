const express = require('express');
const { validarIdsNumericos } = require('../middleware/validarIds');
const { verifyToken, verifyAdmin, verifyGestionAcademica } = require('../middleware/authMiddleware');
const { getColores, cambiarColorAsignatura, cambiarColorDocente } = require('../controllers/colorController');

const router = express.Router();
validarIdsNumericos(router); // 400 si un :id no es numérico (ver middleware/validarIds.js)
router.use(verifyToken);

router.get('/', getColores);
router.put('/asignaturas/:id', verifyGestionAcademica, cambiarColorAsignatura); // también UTP
router.put('/docentes/:id', verifyAdmin, cambiarColorDocente);

module.exports = router;
