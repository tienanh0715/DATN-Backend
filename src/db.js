
const mysql = require('mysql');

const db = mysql.createConnection({
  host: process.env.DB_HOST || "14.225.210.20",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "AjpW*4425",
  database: process.env.NODE_ENV=='test'? process.env.DB_NAME_TEST : (process.env.DB_NAME || "quan_ly_phong_kham"),
  multipleStatements: true,
});

module.exports = db
