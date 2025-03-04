const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");
const moment = require("moment");

export function creditLog() {
  var sql =
    "SELECT p.*, lt.lotto_type_name, (SELECT ROUND(SUM(pay * price)) FROM lotto_number WHERE poy_code = p.poy_code AND status = 'suc') as totalPrize FROM poy as p JOIN lotto_type as lt ON p.lotto_type_id = lt.lotto_type_id WHERE lt.lotto_type_id = ? ORDER BY p.created_at DESC";
  connection.query(sql, [lotto_type_id], (error, result, fields) => {
    if (result === undefined) {
    }
  });
}
