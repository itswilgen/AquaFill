const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

console.log('Connecting with:', {
  socketPath: process.env.DB_SOCKET,
  user:       process.env.DB_USER,
  database:   process.env.DB_NAME,
});

const pool = mysql.createPool({
  socketPath:         process.env.DB_SOCKET,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

pool.getConnection()
  .then(conn => {
    console.log('MySQL connected successfully!');
    conn.release();
  })
  .catch(err => {
    console.error('MySQL connection error:', err.message);
    console.error('Full error:', err);
  });

module.exports = pool;