const mysql = require('mysql2/promise');
require('./env'); // carga el .env

// Datos de conexión a MySQL, compartidos por el pool y los scripts.
// - En la nube (Railway y similares) la base llega como una sola URL:
//   DATABASE_URL o MYSQL_URL = mysql://usuario:clave@host:puerto/base
// - Si no, se usan DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME del .env.
//   Sin valores por defecto para usuario y contraseña (en desarrollo los crea el
//   setup desde .env.example; en producción server.js no arranca si faltan).
// DB_SSL=true: conexión cifrada y verificada contra la CA de Amazon RDS
// (perfil 'Amazon RDS' incluido en mysql2). Recomendado en producción.
function opcionesConexion(extra = {}) {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const destino = url
    ? { uri: url }
    : {
        host    : process.env.DB_HOST || 'localhost',
        port    : Number(process.env.DB_PORT) || 3306,
        user    : process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'sigae',
      };
  return {
    ...destino,
    ...(process.env.DB_SSL === 'true' && { ssl: 'Amazon RDS' }),
    charset: 'utf8mb4',
    ...extra,
  };
}

const pool = mysql.createPool(opcionesConexion({
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}));

module.exports = pool;
module.exports.opcionesConexion = opcionesConexion;
