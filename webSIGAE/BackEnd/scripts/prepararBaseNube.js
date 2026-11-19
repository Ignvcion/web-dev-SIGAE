// scripts/prepararBaseNube.js
// Se ejecuta antes de iniciar el servidor en la nube (ver Dockerfile).
// Si la base está vacía, carga Database/SIGAE.sql (estructura y datos de prueba),
// hashea las contraseñas de prueba y las deja con el correo verificado.
// Si la base ya tiene tablas, no toca nada: nunca borra ni pisa datos.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { opcionesConexion } = require('../config/db');

const ARCHIVO_SQL = process.env.SQL_INICIAL || path.join(__dirname, '..', '..', 'Database', 'SIGAE.sql');
const INTENTOS = 30; // la base de la nube puede tardar en aceptar conexiones al desplegar

// El dump crea y selecciona la base `sigae`; en la nube se usa la base que entrega la URL
function prepararSql(texto) {
  return texto
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((linea) => !/^\s*CREATE DATABASE\b/i.test(linea) && !/^\s*USE\s+`?\w+`?\s*;/i.test(linea))
    .join('\n');
}

async function conectar() {
  for (let intento = 1; ; intento++) {
    try {
      return await mysql.createConnection(opcionesConexion({ multipleStatements: true }));
    } catch (error) {
      if (intento >= INTENTOS) throw error;
      console.log(`La base de datos aún no responde (${error.code || error.message}); reintento ${intento}/${INTENTOS}...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function hashearContrasenasDePrueba(conn) {
  const [usuarios] = await conn.query('SELECT Usuario_Id, Usuario_Contraseña FROM usuario');
  let hasheadas = 0;
  for (const u of usuarios) {
    const actual = String(u['Usuario_Contraseña'] || '');
    if (!actual || actual.startsWith('$2')) continue;
    await conn.query('UPDATE usuario SET Usuario_Contraseña = ? WHERE Usuario_Id = ?', [await bcrypt.hash(actual, 10), u.Usuario_Id]);
    hasheadas++;
  }
  await conn.query('UPDATE usuario SET Usuario_Correo_Verificado = 1 WHERE Usuario_Correo_Verificado = 0');
  return hasheadas;
}

async function main() {
  const conn = await conectar();
  try {
    const [tablas] = await conn.query("SHOW TABLES LIKE 'usuario'");
    if (tablas.length > 0) {
      console.log('Base de datos lista (ya tiene tablas): no se carga nada.');
      return;
    }
    console.log(`Base de datos vacía: cargando ${path.basename(ARCHIVO_SQL)}...`);
    await conn.query(prepararSql(fs.readFileSync(ARCHIVO_SQL, 'utf8')));
    const hasheadas = await hashearContrasenasDePrueba(conn);
    console.log(`Base cargada. Contraseñas de prueba hasheadas: ${hasheadas}.`);
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('No fue posible preparar la base de datos:', error.message);
    process.exit(1);
  });
}

module.exports = { prepararSql };
