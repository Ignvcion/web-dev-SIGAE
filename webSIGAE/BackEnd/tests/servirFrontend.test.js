// Prueba de utils/servirFrontend.js: la app compilada se sirve desde el mismo
// puerto que la API sin tapar /api ni /uploads.
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');
const { instalarFrontend } = require('../utils/servirFrontend');

let dist;
let app;

beforeAll(() => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'sigae-dist-'));
  fs.mkdirSync(path.join(dist, 'assets'));
  fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><div id="root"></div>');
  fs.writeFileSync(path.join(dist, 'sw.js'), 'self.addEventListener("fetch", () => {});');
  fs.writeFileSync(path.join(dist, 'assets', 'index-abc123.js'), 'console.log(1);');

  app = express();
  app.get('/api/estado', (req, res) => res.json({ ok: true }));
  instalarFrontend(app, dist);
  app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
});

afterAll(() => {
  fs.rmSync(dist, { recursive: true, force: true });
});

describe('servirFrontend', () => {
  test('una ruta de la app devuelve index.html sin caché', async () => {
    const res = await request(app).get('/citaciones/historial');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<div id="root">');
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  test('la raíz devuelve index.html', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<div id="root">');
  });

  test('los archivos con hash se guardan en caché', async () => {
    const res = await request(app).get('/assets/index-abc123.js');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('immutable');
  });

  test('el service worker no se guarda en caché', async () => {
    const res = await request(app).get('/sw.js');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  test('la API sigue respondiendo', async () => {
    const res = await request(app).get('/api/estado');
    expect(res.body).toEqual({ ok: true });
  });

  test('una ruta de API que no existe da 404 en JSON, no la página', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Ruta no encontrada');
  });

  test('un archivo que no existe da 404, no la página', async () => {
    const res = await request(app).get('/assets/no-existe.js');
    expect(res.status).toBe(404);
  });

  test('/uploads no cae en la página', async () => {
    const res = await request(app).get('/uploads/foto.png');
    expect(res.status).toBe(404);
  });

  test('sin compilar no instala nada', () => {
    const otra = express();
    const vacia = fs.mkdtempSync(path.join(os.tmpdir(), 'sigae-vacia-'));
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(instalarFrontend(otra, vacia)).toBe(false);
    aviso.mockRestore();
    fs.rmSync(vacia, { recursive: true, force: true });
  });
});
