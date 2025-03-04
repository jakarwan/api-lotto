const mysql = require("mysql2");

const connection = mysql.createConnection({
  // host: process.env.DB_HOST,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASS,
  // database: process.env.DB_NAME,
  // port: process.env.DB_PORT

  host: "127.0.0.1",
  user: "basz",
  password: "26153220.Bb",
  database: "meow_lotto",
  // timezone: "Asia/Bangkok",
  charset: "utf8",
  
});
module.exports = connection;
