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
      //   if (req.query.page && req.query.perPage) {
      const lotto_type_id = req.query.lotto_type_id;
      //   const perPage = req.query.perPage;
      if (lotto_type_id) {
        var sql = "SELECT * FROM promotions WHERE active = 1";
        connection.query(sql, (error, result, fields) => {
          if (result === undefined) {
            return res.status(400).send({ status: false });
          } else {
            //   const data = paginatedResults(req, res, result);
            var sql = "SELECT * FROM lotto_type WHERE lotto_type_id = ?";
            connection.query(
              sql,
              [lotto_type_id],
              (error, resultLotto, fields) => {
                if (resultLotto != "") {
                  return res.status(200).send({
                    status: true,
                    data: result,
                    detail: resultLotto[0],
                  });
                } else {
                  return res.status(400).send({
                    status: false,
                    msg: "ไม่พบรหัสหวยนี้ในระบบ",
                  });
                }
              }
            );
          }
        });
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง lotto_type_id" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.post("/add-rate", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const promotion_name = req.body.promotion_name;
      const discount = req.body.discount;
      const pay = req.body.pay;
      if (promotion_name != null && discount != null && pay != null) {
        var sql =
          "INSERT INTO promotions (promotion_name, discount, pay) VALUES(?, ?, ?)";
        connection.query(
          sql,
          [promotion_name, discount, pay],
          (error, result, fields) => {
            return res
              .status(200)
              .send({ status: true, msg: "เพิ่มโปรโมชั่นหวยสำเร็จ" });
          }
        );
      } else {
        return res.status(400).send({
          status: false,
          msg: "กรุณากรอก ชื่อโปรโมชั่น, ส่วนลด, จำนวนจ่าย",
        });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});
module.exports = router;
