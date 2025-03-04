const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../../../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../../../routes/verifyToken");
const paginatedResults = require("../../../routes/pagination");

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const page = req.query.page;
      const perPage = req.query.perPage;
      const phone = req.query.phone;
      if (page != null && perPage != null) {
        if (phone != null) {
          var sql =
            "SELECT * FROM transaction WHERE status = 0 AND phone LIKE '%' ? '%' ORDER BY `created_at` DESC";
        } else {
          var sql =
            "SELECT * FROM transaction WHERE status = 0 ORDER BY `created_at` DESC";
        }

        connection.query(sql, [phone], (error, result, fields) => {
          if (result === undefined) {
            return res.status(400).send({ status: false });
          } else {
            const data = paginatedResults(req, res, result);
            return res.status(200).send({ status: true, data });
          }
        });
      } else {
        return res
          .status(400)
          .send({ status: "error", msg: "กรุณาส่ง page, perPage" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.put("/submit", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const id = req.body.id;
      const amount = req.body.amount;
      const userId = req.body.userId;
      if (id != undefined && amount != undefined && userId != undefined) {
        var sql = "SELECT * FROM member WHERE id = ?";
        connection.query(sql, [userId], (error, resultMember, fields) => {
          if (resultMember != "") {
            var sql =
              "UPDATE transaction SET status = 1, submit_by = ? WHERE pp_id = ?";
            connection.query(
              sql,
              [data.user.id, id],
              (error, result, fields) => {
                let balance =
                  parseInt(resultMember[0].credit_balance) +
                  parseInt(Math.floor(amount));
                var sql = "UPDATE member SET credit_balance = ? WHERE id = ?";
                connection.query(
                  sql,
                  [balance, userId],
                  (error, result, fields) => {
                    var sql =
                      "INSERT INTO deposite (phone, amount, type, type_dp, add_by, user_id) VALUES(?, ?, ?, ?, ?, ?)";
                    connection.query(
                      sql,
                      [
                        resultMember[0].phone,
                        amount,
                        "พร้อมเพย์",
                        "PP",
                        data.user.id,
                        userId,
                      ],
                      (error, result, fields) => {
                        return res.status(200).send({
                          status: true,
                          msg: "ยืนยันการเติมเงินสำเร็จ",
                        });
                      }
                    );
                  }
                );
              }
            );
          } else {
            return res
              .status(400)
              .send({ status: false, msg: "ไม่พบไอดีนี้ในระบบ" });
          }
        });
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง ไอดี, จำนวนเงิน, userId" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});
module.exports = router;
