const express = require('express');
const { validarIdsNumericos } = require('../middleware/validarIds');
const { login, logout, verificarActivacion, reenviarActivacion } = require('../controllers/authController');
const {
  checkRecoveryEmails,
  forgotPassword,
  resetPassword,
  cambiarContrasena,
} = require('../controllers/passwordController');
const { validateLogin } = require('../middleware/validation');
const { loginLimiter, recoveryLimiter, codigoLimiter } = require('../middleware/rateLimiter');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
validarIdsNumericos(router); // 400 si un :id no es numérico (ver middleware/validarIds.js)

// Autenticación
router.post('/login', loginLimiter, validateLogin, login);
router.post('/logout', logout);

// Primer ingreso: confirmar el correo con el código enviado al iniciar sesión
router.post('/activacion/verificar', codigoLimiter, verificarActivacion);
router.post('/activacion/reenviar', recoveryLimiter, reenviarActivacion);

// Recuperación de contraseña (CU14) con código de verificación
router.post('/check-recovery-emails', recoveryLimiter, checkRecoveryEmails);
router.post('/forgot-password', recoveryLimiter, forgotPassword);
router.post('/reset-password', codigoLimiter, resetPassword);

// Cambio de contraseña con sesión activa
router.put('/cambiar-contrasena', verifyToken, cambiarContrasena);

module.exports = router;
