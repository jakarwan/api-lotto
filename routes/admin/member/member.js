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

// router.put("/add-credit", verifyToken, (req, res) => {
//   jwt.verify(req.token, "secretkey", (err, data) => {
//     if (!err) {
//       if (data.user.role === "SADMIN") {
//         //   var d = moment(new Date()).format("YYYY-MM-DD");
//         var phone = req.body.phone;
//         var amount = req.body.amount;
//         var type = req.body.type;
//         var note = req.body.note;
//         if (phone != "" && amount != "" && type != "") {
//           if (!isNaN(amount)) {
//             if (parseFloat(amount) > 0) {
//               var sql = "SELECT member.credit_balance, member.phone, member.id FROM member WHERE phone = ?";
//               connection.query(sql, [phone], (error, resultMember, fields) => {
//                 if (resultMember != "") {
//                   let credit =
//                     parseFloat(resultMember[0].credit_balance) +
//                     parseFloat(amount);

//                   var sql =
//                     "INSERT INTO deposite (phone, amount, type, type_dp, note, add_by, user_id) VALUES(?, ?, ?, ?, ?, ?, ?)";
//                   connection.query(
//                     sql,
//                     [
//                       resultMember[0].phone,
//                       amount,
//                       type,
//                       "MANUAL",
//                       note,
//                       data.user.id,
//                       resultMember[0].id,
//                     ],
//                     (error, result, fields) => {
//                       var sql =
//                         "UPDATE member SET credit_balance = ? WHERE phone = ?";
//                       connection.query(
//                         sql,
//                         [credit, phone],
//                         (error, result, fields) => {
//                           return res.status(200).send({
//                             status: true,
//                             msg: "เพิ่มเครดิตลูกค้าสำเร็จ",
//                           });
//                         }
//                       );
//                     }
//                   );
//                 } else {
//                   return res
//                     .status(400)
//                     .send({ status: false, msg: "ไม่พบผู้ใช้นี้ในระบบ" });
//                 }
//               });
//             } else {
//               return res
//                 .status(400)
//                 .send({ status: false, msg: "เครดิตต้องไม่น้อยกว่า 1 เครดิต" });
//             }
//           } else {
//             return res.status(400).send({
//               status: false,
//               msg: "กรุณากรอกเครดิตเป็นตัวเลข",
//             });
//           }
//         } else {
//           return res
//             .status(400)
//             .send({ status: false, msg: "กรุณากรอกข้อมูลให้ครบ" });
//         }
//       } else {
//         return res.status(403).send({
//           status: false,
//           msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
//         });
//       }
//     } else {
//       return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
//     }
//   });
// });

const util = require("util");

router.put("/add-credit", verifyToken, async (req, res) => {
  let conn;
  try {
    const decoded = jwt.verify(req.token, "secretkey");

    if (decoded.user.role !== "SADMIN") {
      return res
        .status(403)
        .json({ status: false, msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }

    const { phone, amount, type, note } = req.body;

    if (!phone || !amount || !type) {
      return res
        .status(400)
        .json({ status: false, msg: "กรุณากรอกข้อมูลให้ครบ" });
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({ status: false, msg: "เครดิตต้องเป็นตัวเลขและมากกว่า 0" });
    }

    conn = await connection.promise().getConnection();
    await conn.beginTransaction();

    const [resultMember] = await conn.query(
      "SELECT credit_balance, phone, id FROM member WHERE phone = ? FOR UPDATE",
      [phone]
    );

    if (resultMember.length === 0) {
      await conn.rollback();
      return res
        .status(400)
        .json({ status: false, msg: "ไม่พบผู้ใช้นี้ในระบบ" });
    }

    const member = resultMember[0];
    const newCredit = parseFloat(member.credit_balance) + parseFloat(amount);

    await conn.query(
      "INSERT INTO deposite (phone, amount, type, type_dp, note, add_by, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [member.phone, amount, type, "MANUAL", note, decoded.user.id, member.id]
    );

    await conn.query("UPDATE member SET credit_balance = ? WHERE phone = ?", [
      newCredit,
      phone,
    ]);

    await conn.query(
      `INSERT INTO credit_log (credit_previous, credit_after, created_by, note)
       VALUES (?, ?, ?, ?)`,
      [
        member.credit_balance,
        newCredit,
        member.id,
        `เครดิต +${amount} บาท (${type})`,
      ]
    );

    await conn.commit();
    res.status(200).json({ status: true, msg: "เพิ่มเครดิตลูกค้าสำเร็จ" });
  } catch (err) {
    console.error(err);
    if (conn) await conn.rollback();
    res.status(500).json({ status: false, msg: "เกิดข้อผิดพลาดภายในระบบ" });
  } finally {
    if (conn) conn.release();
  }
});

// router.put("/add-credit", verifyToken, (req, res) => {
//   jwt.verify(req.token, "secretkey", (err, data) => {
//     if (!err) {
//       if (data.user.role === "SADMIN") {
//         //   var d = moment(new Date()).format("YYYY-MM-DD");
//         var phone = req.body.phone;
//         var amount = req.body.amount;
//         var type = req.body.type;
//         var note = req.body.note;
//         if (phone != "" && amount != "" && type != "") {
//           if (!isNaN(amount)) {
//             if (parseFloat(amount) > 0) {
//               var sql =
//                 "SELECT member.credit_balance, member.phone, member.id FROM member WHERE phone = ?";
//               connection.query(sql, [phone], (error, resultMember, fields) => {
//                 if (resultMember != "") {
//                   let credit =
//                     parseFloat(resultMember[0].credit_balance) +
//                     parseFloat(amount);

//                   var sql =
//                     "INSERT INTO deposite (phone, amount, type, type_dp, note, add_by, user_id) VALUES(?, ?, ?, ?, ?, ?, ?)";
//                   connection.query(
//                     sql,
//                     [
//                       resultMember[0].phone,
//                       amount,
//                       type,
//                       "MANUAL",
//                       note,
//                       data.user.id,
//                       resultMember[0].id,
//                     ],
//                     (error, result, fields) => {
//                       var sql =
//                         "UPDATE member SET credit_balance = ? WHERE phone = ?";
//                       connection.query(
//                         sql,
//                         [credit, phone],
//                         (error, result, fields) => {
//                           return res.status(200).send({
//                             status: true,
//                             msg: "เพิ่มเครดิตลูกค้าสำเร็จ",
//                           });
//                         }
//                       );
//                     }
//                   );
//                 } else {
//                   return res
//                     .status(400)
//                     .send({ status: false, msg: "ไม่พบผู้ใช้นี้ในระบบ" });
//                 }
//               });
//             } else {
//               return res
//                 .status(400)
//                 .send({ status: false, msg: "เครดิตต้องไม่น้อยกว่า 1 เครดิต" });
//             }
//           } else {
//             return res.status(400).send({
//               status: false,
//               msg: "กรุณากรอกเครดิตเป็นตัวเลข",
//             });
//           }
//         } else {
//           return res
//             .status(400)
//             .send({ status: false, msg: "กรุณากรอกข้อมูลให้ครบ" });
//         }
//       } else {
//         return res.status(403).send({
//           status: false,
//           msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
//         });
//       }
//     } else {
//       return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
//     }
//   });
// });

// router.put("/add-credit", verifyToken, async (req, res) => {
//   try {
//     const decoded = jwt.verify(req.token, "secretkey");

//     if (decoded.user.role !== "SADMIN") {
//       return res
//         .status(403)
//         .json({ status: false, msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
//     }

//     const { phone, amount, type, note } = req.body;

//     if (!phone || !amount || !type) {
//       return res
//         .status(400)
//         .json({ status: false, msg: "กรุณากรอกข้อมูลให้ครบ" });
//     }

//     if (isNaN(amount) || parseFloat(amount) <= 0) {
//       return res.status(400).json({
//         status: false,
//         msg: "เครดิตต้องเป็นตัวเลขและมากกว่า 0",
//       });
//     }

//     // ใช้ promise wrapper
//     const query = util.promisify(connection.query).bind(connection);

//     // เริ่ม transaction
//     await query("START TRANSACTION");

//     const resultMember = await query(
//       "SELECT credit_balance, phone, id FROM member WHERE phone = ? FOR UPDATE",
//       [phone]
//     );

//     if (resultMember.length === 0) {
//       await query("ROLLBACK");
//       return res
//         .status(400)
//         .json({ status: false, msg: "ไม่พบผู้ใช้นี้ในระบบ" });
//     }

//     const member = resultMember[0];
//     const newCredit = parseFloat(member.credit_balance) + parseFloat(amount);

//     await query(
//       "INSERT INTO deposite (phone, amount, type, type_dp, note, add_by, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
//       [member.phone, amount, type, "MANUAL", note, decoded.user.id, member.id]
//     );

//     await query("UPDATE member SET credit_balance = ? WHERE phone = ?", [
//       newCredit,
//       phone,
//     ]);

//     await query("COMMIT");

//     return res.status(200).json({
//       status: true,
//       msg: "เติมเครดิตสำเร็จ",
//     });
//   } catch (err) {
//     console.error(err);
//     // rollback หากเกิด error
//     try {
//       await util.promisify(connection.query).bind(connection)("ROLLBACK");
//     } catch (rollbackError) {
//       console.error("ROLLBACK error:", rollbackError);
//     }

//     if (err.name === "JsonWebTokenError") {
//       return res.status(403).json({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
//     }

//     return res
//       .status(500)
//       .json({ status: false, msg: "เกิดข้อผิดพลาดภายในระบบ" });
//   }
// });

// router.put("/dis-credit", verifyToken, (req, res) => {
//   jwt.verify(req.token, "secretkey", (err, data) => {
//     if (!err) {
//       if (data.user.role === "SADMIN") {
//         //   var d = moment(new Date()).format("YYYY-MM-DD");
//         var phone = req.body.phone;
//         var amount = req.body.amount;
//         var type = req.body.type;
//         var note = req.body.note;
//         if (phone != null && amount != null && type != null) {
//           if (!isNaN(amount)) {
//             if (parseFloat(amount) > 0) {
//               var sql = "SELECT * FROM member WHERE phone = ?";
//               connection.query(sql, [phone], (error, resultMember, fields) => {
//                 if (resultMember != "") {
//                   if (
//                     parseFloat(resultMember[0].credit_balance) >=
//                     parseFloat(amount)
//                   ) {
//                     let credit =
//                       parseFloat(resultMember[0].credit_balance) -
//                       parseFloat(amount);

//                     var sql =
//                       "INSERT INTO withdraw (phone, amount, type, type_wd, note, dis_by, user_id, status) VALUES(?, ?, ?, ?, ?, ?, ?, ?)";
//                     connection.query(
//                       sql,
//                       [
//                         resultMember[0].phone,
//                         amount,
//                         type,
//                         "DIS",
//                         note,
//                         data.user.id,
//                         resultMember[0].id,
//                         1,
//                       ],
//                       (error, result, fields) => {
//                         var sql =
//                           "UPDATE member SET credit_balance = ? WHERE phone = ?";
//                         connection.query(
//                           sql,
//                           [credit, phone],
//                           (error, result, fields) => {
//                             return res.status(200).send({
//                               status: true,
//                               msg: "ลบดิตลูกค้าสำเร็จ",
//                             });
//                           }
//                         );
//                       }
//                     );
//                   } else {
//                     return res.status(400).send({
//                       status: false,
//                       msg: "เกิดข้อผิดพลาด ยอดเครดิตของผู้ใช้นี้ไม่พอ",
//                     });
//                   }
//                 } else {
//                   return res
//                     .status(400)
//                     .send({ status: false, msg: "ไม่พบผู้ใช้นี้ในระบบ" });
//                 }
//               });
//             } else {
//               return res
//                 .status(400)
//                 .send({ status: false, msg: "เครดิตต้องไม่น้อยกว่า 1 เครดิต" });
//             }
//           } else {
//             return res
//               .status(400)
//               .send({ status: false, msg: "กรุณากรอกเครดิตเป็นตัวเลข" });
//           }
//         } else {
//           return res
//             .status(400)
//             .send({ status: false, msg: "กรุณาส่ง id, amount, type" });
//         }
//       } else {
//         return res.status(403).send({
//           status: false,
//           msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
//         });
//       }
//     } else {
//       return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
//     }
//   });
// });

router.put("/dis-credit", verifyToken, async (req, res) => {
  let conn;
  try {
    const decoded = jwt.verify(req.token, "secretkey");

    if (decoded.user.role !== "SADMIN") {
      return res
        .status(403)
        .json({ status: false, msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }

    const { phone, amount, type, note } = req.body;

    if (!phone || !amount || !type) {
      return res
        .status(400)
        .json({ status: false, msg: "กรุณาส่ง phone, amount, type" });
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({ status: false, msg: "เครดิตต้องเป็นตัวเลขและมากกว่า 0" });
    }

    conn = await connection.promise().getConnection();
    await conn.beginTransaction();

    const [resultMember] = await conn.query(
      "SELECT credit_balance, phone, id FROM member WHERE phone = ? FOR UPDATE",
      [phone]
    );

    if (resultMember.length === 0) {
      await conn.rollback();
      return res
        .status(400)
        .json({ status: false, msg: "ไม่พบผู้ใช้นี้ในระบบ" });
    }

    const member = resultMember[0];
    const currentCredit = parseFloat(member.credit_balance);
    const disAmount = parseFloat(amount);

    if (currentCredit < disAmount) {
      await conn.rollback();
      return res
        .status(400)
        .json({ status: false, msg: "ยอดเครดิตของผู้ใช้นี้ไม่พอ" });
    }

    const newCredit = currentCredit - disAmount;

    await conn.query(
      "INSERT INTO withdraw (phone, amount, type, type_wd, note, dis_by, user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        member.phone,
        disAmount,
        type,
        "DIS",
        note,
        decoded.user.id,
        member.id,
        1,
      ]
    );

    await conn.query("UPDATE member SET credit_balance = ? WHERE phone = ?", [
      newCredit,
      phone,
    ]);

    await conn.query(
      `INSERT INTO credit_log (credit_previous, credit_after, created_by, note)
       VALUES (?, ?, ?, ?)`,
      [
        member.credit_balance,
        newCredit,
        member.id,
        `เครดิต -${disAmount} บาท (${type})`,
      ]
    );

    await conn.commit();
    return res.status(200).json({ status: true, msg: "ลบเครดิตลูกค้าสำเร็จ" });
  } catch (err) {
    console.error(err);
    if (conn) await conn.rollback();
    return res
      .status(500)
      .json({ status: false, msg: "เกิดข้อผิดพลาดภายในระบบ" });
  } finally {
    if (conn) conn.release();
  }
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
              return res.status(400).send({
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

router.get("/deposite-withdraw", verifyToken, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, "secretkey");
    const id = req.query.id;

    const query = util.promisify(connection.query).bind(connection);

    const deposite = await query(`SELECT * FROM deposite WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`, [
      id,
    ]);

    const withdraw = await query(`SELECT * FROM withdraw WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`, [
      id,
    ]);

    return res.status(200).json({
      status: true,
      data: { deposite, withdraw },
    });
  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
    return res
      .status(500)
      .json({ status: false, msg: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

module.exports = router;
