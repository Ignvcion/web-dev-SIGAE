// routes/electivoRoutes.js
// Electivos de 3° y 4° medio: plan del período (CU108) y programación en bloques
// compartidos (CU106). La gestión es del Administrador, el Super Administrador y la etiqueta UTP; los
// electivos se ven además en los horarios del curso, del docente y del estudiante.
const express = require('express');
const { validarIdsNumericos } = require('../middleware/validarIds');
const { verifyToken, verifyGestionAcademica } = require('../middleware/authMiddleware');
const {
  getPlan,
  crearPlan,
  editarPlan,
  clonarPlan,
  getProgramacion,
  programarElectivo,
  eliminarElectivo,
  getElectivosDeCurso,
} = require('../controllers/electivoController');

const router = express.Router();
validarIdsNumericos(router); // 400 si un :id no es numérico (ver middleware/validarIds.js)

// Administración y etiqueta UTP (utils/permisos.js)
router.use(verifyToken, verifyGestionAcademica);

// CU108: plan de electivos del período
router.get('/plan',          getPlan);
router.post('/plan/clonar',  clonarPlan);
router.post('/plan',         crearPlan);
router.put('/plan/:id',      editarPlan);

// CU106: programación de electivos en bloques compartidos
router.get('/programacion',  getProgramacion);
router.post('/clases',       programarElectivo);
router.delete('/clases/:id', eliminarElectivo);

// Electivos en el horario de un curso de 3° o 4° medio
router.get('/curso/:cursoId', getElectivosDeCurso);

module.exports = router;
