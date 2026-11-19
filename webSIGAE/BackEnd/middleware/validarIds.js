// middleware/validarIds.js
// Todos los parámetros de las rutas de la API son identificadores numéricos
// (:id, :cursoId, :estudianteId, ...). Si llega otra cosa (por ejemplo "abc"),
// se responde 400 antes de llegar al controlador, en vez de que la consulta
// SQL falle con un error interno (500).
const NOMBRES = ['id', 'apoderadoId', 'cursoId', 'docenteId', 'estudianteId', 'horarioId', 'usuarioId'];
const MAXIMO = 2147483647; // INT de MySQL

function esIdValido(valor) {
  if (!/^\d{1,10}$/.test(String(valor))) return false;
  const n = Number(valor);
  return n >= 1 && n <= MAXIMO;
}

function validarIdsNumericos(router) {
  for (const nombre of NOMBRES) {
    router.param(nombre, (req, res, next, valor) => {
      if (esIdValido(valor)) return next();
      return res.status(400).json({ error: 'Identificador inválido', mensaje: 'Identificador inválido' });
    });
  }
  return router;
}

module.exports = { validarIdsNumericos, esIdValido };
