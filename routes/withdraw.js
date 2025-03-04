const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");

router.post("/submit", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   var d = moment(new Date()).format("YYYY-MM-DD");
      //   var id = req.body.id;
      var amount = req.body.amount;
      //   var type = req.body.type;
      //   var note = req.body.note;
      if (amount != undefined) {
        if (!isNaN(amount)) {
          if (parseFloat(amount) > 0) {
            var sql = "SELECT * FROM member WHERE id = ?";
            connection.query(
              sql,
              [data.user.id],
              (error, resultMember, fields) => {
                if (resultMember != "") {
                  if (
                    parseFloat(resultMember[0].credit_balance) >=
                    parseFloat(amount)
                  ) {
                    // let credit =
                    //   parseFloat(resultMember[0].credit_balance) -
                    //   parseFloat(amount);
                    var sql =
                      "SELECT * FROM withdraw WHERE user_id = ? AND type_wd = 'WD' AND status = 0";
                    connection.query(
                      sql,
                      [data.user.id],
                      (error, resultWithdraw, fields) => {
                        if (resultWithdraw == "") {
                          var sql =
                            "INSERT INTO withdraw (phone, amount, type_wd, user_id) VALUES(?, ?, ?, ?)";
                          connection.query(
                            sql,
                            [resultMember[0].phone, amount, "WD", data.user.id],
                            (error, result, fields) => {
                              // var sql =
                              //   "UPDATE member SET credit_balance = ? WHERE id = ?";
                              // connection.query(
                              //   sql,
                              //   [credit, id],
                              //   (error, result, fields) => {
                              //
                              //     return res.status(200).send({
                              //       status: true,
                              //       msg: "ลบดิตลูกค้าสำเร็จ",
                              //     });
                              //   }
                              // );
                              return res.status(200).send({
                                status: true,
                                msg: "แจ้งถอนสำเร็จ รอระบบทำรายการสักครู่",
                              });
                            }
                          );
                        } else {
                          return res.status(400).send({
                            status: false,
                            msg: "ท่านแจ้งถอนไปแล้ว รอระบบตรวจสอบสักครู่",
                          });
                        }
                      }
                    );
                  } else {
                    return res.status(400).send({
                      status: false,
                      msg: "เกิดข้อผิดพลาด ยอดเครดิตของท่านไม่พอ",
                    });
                  }
                } else {
                  return res
                    .status(400)
                    .send({ status: false, msg: "ไม่พบผู้ใช้นี้ในระบบ" });
                }
              }
            );
          } else {
            return res
              .status(400)
              .send({ status: false, msg: "เครดิตต้องไม่น้อยกว่า 1 เครดิต" });
          }
        } else {
          return res
            .status(400)
            .send({ status: false, msg: "กรุณากรอกเครดิตเป็นตัวเลข" });
        }
      } else {
        return res.status(400).send({ status: false, msg: "กรุณาส่ง amount" });
      }
    } else {
      return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});
module.exports = router;
