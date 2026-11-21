require('dotenv').config();
const mysql = require('mysql2');

const configconnection = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_HOST
        ? { rejectUnauthorized: true }
        : undefined
};

const pool = mysql.createPool(configconnection);

module.exports = pool;