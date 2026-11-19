// utils/servirFrontend.js
// Sirve el FrontEnd compilado (npm run build → FrontEnd/dist) desde el mismo
// puerto que la API. Así un solo túnel HTTPS (ngrok o Cloudflare) publica la
// app completa: páginas, /api y /uploads en la misma dirección, sin CORS.
// Se activa con SERVIR_FRONTEND=1 (lo hace iniciar-sigae.ps1).
const fs = require('fs');
const path = require('path');
const express = require('express');

const DIST_POR_DEFECTO = path.join(__dirname, '..', '..', 'FrontEnd', 'dist');

// Archivos que el navegador debe pedir de nuevo siempre: si no, la PWA podría
// quedarse con una versión vieja (service worker, manifest, página principal).
const SIN_CACHE = new Set(['index.html', 'sw.js', 'manifest.json']);

// Rutas de la app (React Router): todo GET que no sea API ni archivo subido, y
// sin punto (un archivo que no existe, como /assets/x.js, debe dar 404 y no la página)
const RUTA_DE_LA_APP = /^\/(?!api(?:\/|$)|uploads(?:\/|$))[^.]*$/;

function instalarFrontend(app, dist = process.env.FRONTEND_DIST || DIST_POR_DEFECTO) {
  const carpeta = path.resolve(dist);
  const indice = path.join(carpeta, 'index.html');
  if (!fs.existsSync(indice)) {
    console.warn(`SERVIR_FRONTEND=1 pero no existe ${indice}: ejecuta "npm run build" en FrontEnd.`);
    return false;
  }

  app.use(express.static(carpeta, {
    index: false,
    setHeaders(res, ruta) {
      const nombre = path.basename(ruta);
      if (SIN_CACHE.has(nombre)) {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (ruta.includes(`${path.sep}assets${path.sep}`)) {
        // Vite pone un hash en el nombre: pueden guardarse para siempre
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  app.get(RUTA_DE_LA_APP, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indice);
  });
  return true;
}

module.exports = { instalarFrontend, RUTA_DE_LA_APP };
