const express = require("express");
const { validarIdsNumericos } = require('../middleware/validarIds');
const router = express.Router();
validarIdsNumericos(router); // 400 si un :id no es numérico (ver middleware/validarIds.js)
const dashboardController = require("../controllers/dashboardController");
const { verifyToken } = require('../middleware/authMiddleware');

router.get("/stats", verifyToken, dashboardController.getStats);

module.exports = router;