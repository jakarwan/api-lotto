const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");
const moment = require("moment");

var d = new Date();
const ddd = d.setDate(d.getDate() - d.getDay());
const today = moment().format("YYYY-MM-DD");
const week = moment(ddd).format("YYYY-MM-DD");
console.log(week, "week");

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      //   const page = req.query.page;
      const phone = req.query.phone;
      // const week = moment().add(7, "days").format("YYYY-MM-DD");
      if (phone != null) {
        var sql = `SELECT IFNULL((SELECT SUM(p.total) FROM poy as p WHERE p.created_by = mb.id AND p.installment_date = '${today}' AND p.status_result = 1 AND p.status = 'SUC'), 0) as total,
        IFNULL((SELECT SUM(pl.total) FROM prize_log as pl WHERE pl.created_by = mb.id AND pl.lotto_date = '${today}'), 0) as prize_total,
        (SELECT aff_percentage FROM member WHERE phone = '${phone}') as aff_percentage,
        mb.phone, mb.created_at, mb.is_active FROM member as mb WHERE mb.refs_code = ?
          `;
        connection.query(sql, [phone], (error, result, fields) => {
          if (error) throw error;
          if (result === undefined) {
            return res.status(400).send({ status: false });
          } else {
            var sql =
              "SELECT *, IFNULL((SELECT SUM(amount) FROM transfer_log_aff WHERE m_id = mb.id), 0) as total_amount_aff FROM member as mb WHERE mb.phone = ?;";
            connection.query(sql, [phone], (error, resultAff, fields) => {
              if (error) throw error;
              if (resultAff.length > 0) {
                let sum = 0;
                let aff_amount = 0;
                result.forEach((item, index) => {
                  console.log(item.total, "-", item.prize_total);
                  sum += item.total;
                  aff_amount += (item.total * item.aff_percentage) / 100;
                  result[index].aff_amount =
                    (item.total * item.aff_percentage) / 100;
                });

                var sql = "SELECT aff_percentage FROM member WHERE phone = ?";
                connection.query(
                  sql,
                  [phone],
                  (error, resultMember, fields) => {
                    if (error) throw error;
                    return res.status(200).send({
                      status: true,
                      data: result,
                      total_prize: sum,
                      aff_amount: aff_amount,
                      credit_aff: resultAff[0].credit_aff,
                      total_amount_aff: resultAff[0].total_amount_aff,
                      aff_percentage: resultMember[0].aff_percentage,
                    });
                  }
                );
              } else {
                return res.status(400).send({ status: false });
              }
            });
          }
        });
      } else {
        return res
          .status(400)
          .send({ status: "error", msg: "กรุณาส่ง ชื่อผู้ใช้" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/aff-log", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      //   const page = req.query.page;
      const phone = req.query.phone;
      if (phone != null) {
        var sql =
          // "SELECT al.*, mb.phone FROM aff_log as al LEFT JOIN member as mb ON al.user_id = mb.id WHERE mb.refs_code = ? ORDER BY created_at DESC";
          "SELECT refs_code, amount, created_at, lotto_type_id, user_id, aff_amount FROM aff_log WHERE refs_code = ? GROUP BY aff_date";
        //   } else {
        //     var sql =
        //       "SELECT af.*, mb.refs_code, mb.id, mb.phone FROM affiliate as af JOIN member as mb ON af.refs_code = mb.refs_code WHERE af.refs_code = ? GROUP BY af.refs_code";
        //   }
        connection.query(sql, [phone], (error, result, fields) => {
          if (error) throw error;
          if (result === undefined) {
            return res.status(400).send({ status: false });
          } else {
            //   const data = [];
            //   result.forEach((el, index) => {
            //     data.push(el);
            //     data[index].total = el.total.toFixed(2);
            //   });
            //   console.log(data);
            //   const data = paginatedResults(req, res, result);
            return res.status(200).send({ status: true, data: result });
          }
        });
      } else {
        return res.status(400).send({ status: "error", msg: "กรุณาส่ง phone" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/log-daily", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      //   const page = req.query.page;
      const phone = req.query.phone;
      if (phone != null) {
        var sql = "SELECT * FROM member WHERE phone = ?";
        connection.query(sql, [phone], (error, result, fields) => {
          if (error) throw error;
          if (result === undefined) {
            return res.status(400).send({ status: false });
          } else {
            console.log(result[0].id);
            var sql = `SELECT IFNULL(SUM(total), 0) as sum_total, IFNULL(SUM(total_aff), 0) as sum_total_aff, m_id_header, m_id_user, created_at FROM aff_log_daily WHERE m_id_header = ? GROUP BY DATE_FORMAT(created_at, "%Y-%m-%d");`;
            connection.query(
              sql,
              [result[0].id],
              (error, resultPoy, fields) => {
                if (error) throw error;
                if (resultPoy === undefined) {
                  return res.status(400).send({ status: false });
                } else {
                  return res
                    .status(200)
                    .send({ status: true, data: resultPoy });
                }
              }
            );
          }
        });
      } else {
        return res.status(400).send({ status: "error", msg: "กรุณาส่ง phone" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

// router.get("/commission", verifyToken, (req, res) => {
//   jwt.verify(req.token, "secretkey", (err, data) => {
//     if (!err) {
//       //   if (req.query.page && req.query.perPage) {
//       //   const page = req.query.page;
//       const phone = req.query.phone;
//       if (phone != null) {
//         var sql = "SELECT * FROM member WHERE phone = ?";
//         connection.query(sql, [phone], (error, result, fields) => {
//           if (error) throw error;
//           if (result === undefined) {
//             return res.status(400).send({ status: false });
//           } else {
//             console.log(result[0].id);
//             var sql = `SELECT SUM((total * 5) / 100) as sum_total FROM poy WHERE created_by = ? AND installment_date = '${today}' AND status = 'SUC'`;
//             connection.query(
//               sql,
//               [result[0].id],
//               (error, resultPoy, fields) => {
//                 if (error) throw error;
//                 if (resultPoy === undefined) {
//                   return res.status(400).send({ status: false });
//                 } else {
//                   return res
//                     .status(200)
//                     .send({ status: true, data: resultPoy });
//                 }
//               }
//             );
//           }
//         });
//       } else {
//         return res.status(400).send({ status: "error", msg: "กรุณาส่ง phone" });
//       }
//     } else {
//       res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
//     }
//   });
// });

router.get("/transfer-log", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      //   const page = req.query.page;
      const phone = req.query.phone;
      if (phone != null) {
        var sql = "SELECT * FROM member WHERE phone = ?";
        connection.query(sql, [phone], (error, result, fields) => {
          if (error) throw error;
          if (result.length > 0) {
            console.log(result[0].id);
            var sql = `SELECT * FROM transfer_log_aff WHERE m_id = ?`;
            connection.query(
              sql,
              [result[0].id],
              (error, resultTransfer, fields) => {
                if (error) throw error;
                if (resultTransfer === undefined) {
                  return res.status(400).send({ status: false });
                } else {
                  return res
                    .status(200)
                    .send({ status: true, data: resultTransfer });
                }
              }
            );
          } else {
            return res.status(400).send({ status: false });
          }
        });
      } else {
        return res.status(400).send({ status: "error", msg: "กรุณาส่ง phone" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/transfer-log-aff", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      //   const page = req.query.page;
      const phone = req.query.phone;
      if (phone != null) {
        var sql = "SELECT * FROM member WHERE phone = ?";
        connection.query(sql, [phone], (error, result, fields) => {
          if (error) throw error;
          if (result.length > 0) {
            var sql = `SELECT * FROM transfer_log_aff WHERE m_id = ?`;
            connection.query(
              sql,
              [result[0].id],
              (error, resultTransfer, fields) => {
                if (error) throw error;
                if (resultTransfer === undefined) {
                  return res.status(400).send({ status: false });
                } else {
                  return res
                    .status(200)
                    .send({ status: true, data: resultTransfer });
                }
              }
            );
          } else {
            return res.status(400).send({ status: false });
          }
        });
      } else {
        return res.status(400).send({ status: "error", msg: "กรุณาส่ง phone" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.post("/transfer-aff", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      //   const page = req.query.page;
      const phone = req.body.phone;
      const amount = req.body.amount;
      if (phone != null || amount != null) {
        var sql = "SELECT * FROM member WHERE phone = ?";
        connection.query(sql, [phone], (error, result, fields) => {
          if (error) throw error;
          if (result.length > 0) {
            if (amount > result[0].credit_aff) {
              return res
                .status(400)
                .send({ status: false, msg: "ยอดไม่เพียงพอ" });
            } else {
              var sql = `INSERT INTO transfer_log_aff (m_id, amount, credit_before, credit_after) VALUES (?, ?, ?, ?)`;
              connection.query(
                sql,
                [
                  result[0].id,
                  parseFloat(amount),
                  result[0].credit_balance,
                  result[0].credit_balance + parseFloat(amount),
                ],
                (error, resultTransfer, fields) => {
                  if (error) throw error;
                  var sql = `UPDATE member set credit_balance = ?, credit_aff = ? WHERE id = ?`;
                  connection.query(
                    sql,
                    [
                      result[0].credit_balance + parseFloat(amount),
                      0,
                      result[0].id,
                    ],
                    (error, resultTransfer, fields) => {
                      return res
                        .status(200)
                        .send({ status: "success", msg: "แจ้งถอนสำเร็จ" });
                    }
                  );
                }
              );
            }
          } else {
            return res.status(400).send({ status: false });
          }
        });
      } else {
        return res.status(400).send({ status: "error", msg: "กรุณาส่ง phone" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

// router.post("/add-type", verifyToken, (req, res) => {
//   jwt.verify(req.token, "secretkey", (err, data) => {
//     if (!err) {
//       const type = req.body.type;
//       if (type) {
//         var sql = "INSERT INTO type (type) VALUES(?)";
//         connection.query(sql, [type], (error, result, fields) => {
//
//           return res
//             .status(200)
//             .send({ status: true, msg: "เพิ่มประเภทหวยสำเร็จ" });
//         });
//       } else {
//         return res
//           .status(400)
//           .send({ status: false, msg: "กรุณาส่ง ชื่อประเภทหวย" });
//       }
//     } else {
//       res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
//     }
//   });
// });
module.exports = router;
