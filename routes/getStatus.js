const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const type_id = req.query.type_id;
      if (type_id != null) {
        var sql =
          "SELECT * FROM lotto_type WHERE lotto_type_id = ? AND open = 1";
        connection.query(sql, [type_id], (error, result, fields) => {
          if (result == "") {
            return res
              .status(200)
              .send({ status: false, msg: "ปิดรับแทงแล้ว" });
          } else {
            //   const data = paginatedResults(req, res, result);
            return res.status(200).send({ status: true });
          }
        });
      } else {
        return res.status(400).send({ status: false, msg: "กรุณาส่ง type_id" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});
module.exports = router;
