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
            "SELECT wd.*, mb.bank, mb.bank_number, mb.name, mb.familyName FROM withdraw as wd JOIN member as mb ON wd.user_id = mb.id WHERE wd.status = 0 AND wd.phone LIKE '%' ? '%' AND wd.type_wd = 'WD' ORDER BY wd.created_at DESC";
        } else {
          var sql =
            "SELECT wd.*, mb.bank, mb.bank_number, mb.name, mb.familyName FROM withdraw as wd JOIN member as mb ON wd.user_id = mb.id WHERE wd.status = 0 AND wd.type_wd = ? ORDER BY wd.created_at DESC";
        }

        connection.query(sql, [phone ?? "WD"], (error, result, fields) => {
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
            if (
              parseFloat(resultMember[0].credit_balance) >= parseFloat(amount)
            ) {
              var sql =
                "UPDATE withdraw SET status = 1, dis_by = ? WHERE wd_id = ?";
              connection.query(
                sql,
                [data.user.id, id],
                (error, result, fields) => {
                  let balance =
                    parseFloat(resultMember[0].credit_balance) -
                    parseFloat(amount);
                  var sql = "UPDATE member SET credit_balance = ? WHERE id = ?";
                  connection.query(
                    sql,
                    [balance, userId],
                    (error, result, fields) => {
                      //   var sql =
                      //     "INSERT INTO deposite (phone, amount, type, type_dp, add_by, user_id) VALUES(?, ?, ?, ?, ?, ?)";
                      //   connection.query(
                      //     sql,
                      //     [
                      //       resultMember[0].phone,
                      //       amount,
                      //       "พร้อมเพย์",
                      //       "PP",
                      //       data.user.id,
                      //       userId,
                      //     ],
                      //     (error, result, fields) => {
                      //
                      return res
                        .status(200)
                        .send({ status: true, msg: "แจ้งถอนเงินสำเร็จ" });
                      //     }
                      //   );
                    }
                  );
                }
              );
            } else {
              return res
                .status(400)
                .send({ status: false, msg: "ยอดเงินในระบบไม่พอถอน" });
            }
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
