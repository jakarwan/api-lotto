const mysql = require("mysql2");

const connection = mysql.createPool({
  // host: process.env.DB_HOST,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASS,
  // database: process.env.DB_NAME,
  // port: process.env.DB_PORT

  host: "159.223.77.99",
  // host: "127.0.0.1",
  user: "basz",
  password: "26153220.Bb",
  // password: "",
  database: "meow_lotto",
  // timezone: "Asia/Bangkok",
  charset: "utf8",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
});
module.exports = connection;
