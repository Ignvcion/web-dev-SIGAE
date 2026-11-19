// Prueba de middleware/validarIds.js: los :id que no son números dan 400 y no llegan al controlador.
const express = require('express');
const request = require('supertest');
const { validarIdsNumericos, esIdValido } = require('../middleware/validarIds');

const app = express();
const router = express.Router();
validarIdsNumericos(router);
const controlador = jest.fn((req, res) => res.json({ id: req.params.id, cursoId: req.params.cursoId }));
router.get('/cosas/:id', controlador);
router.get('/cursos/:cursoId/estudiantes', controlador);
app.use('/api', router);

describe('validarIds', () => {
  beforeEach(() => controlador.mockClear());

  test.each(['abc', '-1', '0', '1.5', '1 OR 1=1', '99999999999', '2147483648'])('rechaza %p con 400', async (id) => {
    const res = await request(app).get(`/api/cosas/${encodeURIComponent(id)}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Identificador inválido');
    expect(controlador).not.toHaveBeenCalled();
  });

  test('acepta un id numérico', async () => {
    const res = await request(app).get('/api/cosas/42');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('42');
  });

  test('valida también otros nombres de parámetro', async () => {
    expect((await request(app).get('/api/cursos/xyz/estudiantes')).status).toBe(400);
    expect((await request(app).get('/api/cursos/7/estudiantes')).status).toBe(200);
  });

  test('esIdValido', () => {
    expect(esIdValido('1')).toBe(true);
    expect(esIdValido('2147483647')).toBe(true);
    expect(esIdValido('')).toBe(false);
  });
});
