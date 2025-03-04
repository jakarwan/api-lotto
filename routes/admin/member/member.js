const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../../../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../../../routes/verifyToken");
const paginatedResults = require("../../../routes/pagination");
// const moment = require("moment");

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, user) => {
    if (!err) {
      if (user.user.role === "SADMIN") {
        //   var d = moment(new Date()).format("YYYY-MM-DD");
        var page = req.query.page;
        var perPage = req.query.perPage;
        var filter = req.query.filter;
        if (page != null && perPage != null) {
          if (filter != undefined) {
            var sql =
              "SELECT * FROM member WHERE phone LIKE '%' ? '%' OR name LIKE '%' ? '%' OR familyName LIKE '%' ? '%' AND role != 'SADMIN' ORDER BY credit_balance DESC";
          } else {
            var sql =
              "SELECT * FROM member WHERE role != 'SADMIN' ORDER BY credit_balance DESC";
          }
          connection.query(
            sql,
            [filter, filter, filter],
            (error, result, fields) => {
              const data = paginatedResults(req, res, result);
              return res.status(200).send({ status: true, data });
            }
          );
        } else {
          return res
            .status(400)
            .send({ status: false, msg: "กรุณาส่ง page, perPage" });
        }
      } else {
        return res.status(403).send({
          status: false,
          msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
        });
      }
    } else {
      return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.put("/add-credit", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      if (data.user.role === "SADMIN") {
        //   var d = moment(new Date()).format("YYYY-MM-DD");
        var phone = req.body.phone;
        var amount = req.body.amount;
        var type = req.body.type;
        var note = req.body.note;
        if (phone != "" && amount != "" && type != "") {
          if (!isNaN(amount)) {
            if (parseFloat(amount) > 0) {
              var sql = "SELECT * FROM member WHERE phone = ?";
              connection.query(sql, [phone], (error, resultMember, fields) => {
                if (resultMember != "") {
                  let credit =
                    parseFloat(resultMember[0].credit_balance) +
                    parseFloat(amount);

                  var sql =
                    "INSERT INTO deposite (phone, amount, type, type_dp, note, add_by, user_id) VALUES(?, ?, ?, ?, ?, ?, ?)";
                  connection.query(
                    sql,
                    [
                      resultMember[0].phone,
                      amount,
                      type,
                      "MANUAL",
                      note,
                      data.user.id,
                      resultMember[0].id,
                    ],
                    (error, result, fields) => {
                      var sql =
                        "UPDATE member SET credit_balance = ? WHERE phone = ?";
                      connection.query(
                        sql,
                        [credit, phone],
                        (error, result, fields) => {
                          return res.status(200).send({
                            status: true,
                            msg: "เพิ่มเครดิตลูกค้าสำเร็จ",
                          });
                        }
                      );
                    }
                  );
                } else {
                  return res
                    .status(400)
                    .send({ status: false, msg: "ไม่พบผู้ใช้นี้ในระบบ" });
                }
              });
            } else {
              return res
                .status(400)
                .send({ status: false, msg: "เครดิตต้องไม่น้อยกว่า 1 เครดิต" });
            }
          } else {
            return res.status(400).send({
              status: false,
              msg: "กรุณากรอกเครดิตเป็นตัวเลข",
            });
          }
        } else {
          return res
            .status(400)
            .send({ status: false, msg: "กรุณากรอกข้อมูลให้ครบ" });
        }
      } else {
        return res.status(403).send({
          status: false,
          msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
        });
      }
    } else {
      return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.put("/dis-credit", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      if (data.user.role === "SADMIN") {
        //   var d = moment(new Date()).format("YYYY-MM-DD");
        var phone = req.body.phone;
        var amount = req.body.amount;
        var type = req.body.type;
        var note = req.body.note;
        if (phone != null && amount != null && type != null) {
          if (!isNaN(amount)) {
            if (parseFloat(amount) > 0) {
              var sql = "SELECT * FROM member WHERE phone = ?";
              connection.query(sql, [phone], (error, resultMember, fields) => {
                if (resultMember != "") {
                  if (
                    parseFloat(resultMember[0].credit_balance) >=
                    parseFloat(amount)
                  ) {
                    let credit =
                      parseFloat(resultMember[0].credit_balance) -
                      parseFloat(amount);

                    var sql =
                      "INSERT INTO withdraw (phone, amount, type, type_wd, note, dis_by, user_id, status) VALUES(?, ?, ?, ?, ?, ?, ?, ?)";
                    connection.query(
                      sql,
                      [
                        resultMember[0].phone,
                        amount,
                        type,
                        "DIS",
                        note,
                        data.user.id,
                        resultMember[0].id,
                        1,
                      ],
                      (error, result, fields) => {
                        var sql =
                          "UPDATE member SET credit_balance = ? WHERE phone = ?";
                        connection.query(
                          sql,
                          [credit, phone],
                          (error, result, fields) => {
                            return res.status(200).send({
                              status: true,
                              msg: "ลบดิตลูกค้าสำเร็จ",
                            });
                          }
                        );
                      }
                    );
                  } else {
                    return res.status(400).send({
                      status: false,
                      msg: "เกิดข้อผิดพลาด ยอดเครดิตของผู้ใช้นี้ไม่พอ",
                    });
                  }
                } else {
                  return res
                    .status(400)
                    .send({ status: false, msg: "ไม่พบผู้ใช้นี้ในระบบ" });
                }
              });
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
          return res
            .status(400)
            .send({ status: false, msg: "กรุณาส่ง id, amount, type" });
        }
      } else {
        return res.status(403).send({
          status: false,
          msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
        });
      }
    } else {
      return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.put("/ban-user", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, user) => {
    if (!err) {
      if (user.user.role === "SADMIN") {
        //   var d = moment(new Date()).format("YYYY-MM-DD");
        var phone = req.body.phone;
        if (phone != null) {
          var sql = "SELECT * FROM member WHERE phone = ?";
          connection.query(sql, [phone], (error, resultMember, fields) => {
            if (resultMember != "") {
              let status = 0;
              if (resultMember[0].is_active == 1) {
                status = 0;
              } else {
                status = 1;
              }
              var sql = "UPDATE member SET is_active = ? WHERE phone = ?";
              connection.query(
                sql,
                [status, phone],
                (error, result, fields) => {
                  return res
                    .status(200)
                    .send({ status: true, msg: "อัพเดทสถานะผู้ใช้งานสำเร็จ" });
                }
              );
            } else {
              return res
                .status(400)
                .send({ status: false, msg: "ไม่พบผู้ใช้นี้ในระบบ" });
            }
          });
        } else {
          return res.status(400).send({ status: false, msg: "กรุณาส่ง id" });
        }
      } else {
        return res.status(403).send({
          status: false,
          msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
        });
      }
    } else {
      return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.put("/update-aff-user", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, user) => {
    if (!err) {
      if (user.user.role === "SADMIN") {
        //   var d = moment(new Date()).format("YYYY-MM-DD");
        var id = req.body.id;
        var percentage = req.body.percentage;
        if (id != null && percentage != null) {
          if (!isNaN(percentage)) {
            if (percentage >= 0 && percentage <= 100) {
              var sql = "UPDATE member SET aff_percentage = ? WHERE id = ?";
              connection.query(
                sql,
                [percentage, id],
                (error, result, fields) => {
                  return res.status(200).send({
                    status: true,
                    msg: "อัพเดท affiliate ผู้ใช้งานสำเร็จ",
                  });
                }
              );
            } else {
              return res
                .status(400)
                .send({
                  status: false,
                  msg: "เปอร์เซ็นต์ต้องไม่น้อยกว่า 0 และไม่เกิน 100",
                });
            }
          } else {
            return res
              .status(400)
              .send({ status: false, msg: "กรุณาส่ง percentage เป็นตัวเลข" });
          }
        } else {
          return res
            .status(400)
            .send({ status: false, msg: "กรุณาส่ง id, percentage" });
        }
      } else {
        return res.status(403).send({
          status: false,
          msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
        });
      }
    } else {
      return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

module.exports = router;
