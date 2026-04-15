const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const useSocket = Boolean(process.env.DB_SOCKET);

const baseConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const poolConfig = useSocket
  ? {
      ...baseConfig,
      socketPath: process.env.DB_SOCKET,
    }
  : {
      ...baseConfig,
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
    };

console.log('Connecting with:', {
  mode: useSocket ? 'socket' : 'tcp',
  socketPath: poolConfig.socketPath || null,
  host: poolConfig.host || null,
  port: poolConfig.port || null,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
});

const pool = mysql.createPool(poolConfig);

pool.getConnection()
  .then((conn) => {
    console.log('MySQL connected successfully!');
    conn.release();
  })
  .catch((err) => {
    console.error('MySQL connection error:', err.message);
    console.error('Full error:', err);
  });

module.exports = pool;
