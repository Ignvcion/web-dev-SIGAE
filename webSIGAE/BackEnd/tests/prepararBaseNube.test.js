// Prueba de scripts/prepararBaseNube.js: el dump se adapta a la base que entrega la nube.
const fs = require('fs');
const path = require('path');

jest.mock('../config/db', () => ({ opcionesConexion: () => ({}) }));
const { prepararSql } = require('../scripts/prepararBaseNube');

const DUMP = fs.readFileSync(path.join(__dirname, '..', '..', 'Database', 'SIGAE.sql'), 'utf8');

describe('prepararBaseNube.prepararSql', () => {
  const sql = prepararSql(DUMP);

  test('quita CREATE DATABASE y USE del dump real', () => {
    expect(sql).not.toMatch(/^\s*CREATE DATABASE/im);
    expect(sql).not.toMatch(/^\s*USE\s+`?sigae`?\s*;/im);
  });

  test('conserva la creación de tablas y los datos', () => {
    const tablasDump = (DUMP.match(/^CREATE TABLE/gm) || []).length;
    expect(tablasDump).toBeGreaterThan(10);
    expect((sql.match(/^CREATE TABLE/gm) || []).length).toBe(tablasDump);
    expect((sql.match(/^INSERT INTO/gm) || []).length).toBe((DUMP.match(/^INSERT INTO/gm) || []).length);
    expect(sql).toMatch(/CREATE TABLE `usuario`/);
  });

  test('funciona con saltos de línea de Windows y BOM', () => {
    const conBom = '﻿CREATE DATABASE x;\r\nUSE `x`;\r\nCREATE TABLE t (id int);\r\n';
    expect(prepararSql(conBom).trim()).toBe('CREATE TABLE t (id int);');
  });
});
