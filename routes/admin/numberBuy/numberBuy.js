const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../../../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../../../routes/verifyToken");
const paginatedResults = require("../../../routes/pagination");
const moment = require("moment");

router.get("/", (req, res) => {
  // jwt.verify(req.token, "secretkey", (err, data) => {
  // if (!err) {
  var lotto_type_id = req.query.lotto_type_id;
  var date = req.query.date;
  if (lotto_type_id != null && date != null) {
    var sql =
      "SELECT number, type_option, COUNT(*) as count FROM lotto_number WHERE lotto_type_id = ? AND installment_date = ? GROUP BY number HAVING COUNT(*) > 1 ORDER BY count DESC LIMIT 20";
    connection.query(sql, [lotto_type_id, date], (error, result, fields) => {
      // if (result != "") {
      return res.status(200).send({ status: true, data: result });
      // } else {
      //   return res.status(200).send({ status: false, data: result });
      // }
    });
  } else {
    return res
      .status(400)
      .send({ status: false, msg: "กรุณาส่ง lotto_type_id" });
  }
  // } else {
  //     return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
  // }
  // });
});

router.get("/coin", (req, res) => {
  // jwt.verify(req.token, "secretkey", (err, data) => {
  // if (!err) {
  var lotto_type_id = req.query.lotto_type_id;
  var date = req.query.date;
  if (lotto_type_id != null && date != null) {
    var sql =
      "SELECT number, type_option, price, poy_code FROM lotto_number WHERE lotto_type_id = ? AND installment_date = ? AND price >= 5 ORDER BY price DESC";
    connection.query(sql, [lotto_type_id, date], (error, result, fields) => {
      // if (result != "") {
      return res.status(200).send({ status: true, data: result });
      // } else {
      //   return res.status(200).send({ status: false, data: result });
      // }
    });
  } else {
    return res
      .status(400)
      .send({ status: false, msg: "กรุณาส่ง lotto_type_id" });
  }
  // } else {
  //     return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
  // }
  // });
});

router.get("/lotto-play-total", (req, res) => {
  // jwt.verify(req.token, "secretkey", (err, data) => {
  // if (!err) {
  var lotto_type_id = req.query.lotto_type_id;
  var date = req.query.date;
  if (date != null) {
    var sql =
      "SELECT number, type_option, COUNT(*) AS count, SUM(price) AS total FROM lotto_number WHERE lotto_type_id = ? AND installment_date = ? GROUP BY number, type_option ORDER BY total DESC;";
    connection.query(sql, [lotto_type_id, date], (error, result, fields) => {
      return res.status(200).send({ status: true, data: result });
    });
  } else {
    return res
      .status(400)
      .send({ status: false, msg: "กรุณาส่ง lotto_type_id, date" });
  }
});

module.exports = router;
