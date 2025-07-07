const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");
const moment = require("moment");

function func6back(number) {
  var num = number; //ตัวเลขที่ต้องการหาโต๊ด
  var textnum = num.toString(); //แปลงตัวเลขเป็นตัวอักษร
  var numlv1 = []; //ประกาศตัวแปลให้เป็น Array
  var numlv2 = [];
  var result = [];
  //จัดการ level 1 โดยการสลับตัวเลข 2 หลักซ้ายสุด
  numlv1[0] = textnum.substr(0, 1) + textnum.substr(1, 1);
  numlv1[1] = textnum.substr(1, 1) + textnum.substr(0, 1);
  //จัดการ level 2
  var endnum = textnum.substr(2, 1); //จำเลขตัวสุดท้าย
  for (var i = 0; i <= 2 - 1; i++) {
    numlv2[0] = numlv1[i].substr(0, 1); //แยกตัวเลข หลักแรกออกมา จากตัวเลข level 1
    numlv2[1] = numlv1[i].substr(1, 1); //แยกตัวเลข หลักที่ 2 ออกมา จากตัวเลข level 1
    result.push(
      endnum + numlv2[0] + numlv2[1],
      numlv2[0] + endnum + numlv2[1],
      numlv2[0] + numlv2[1] + endnum
    );
  }
  let dup = [...new Set(result)];
  return dup;
}

router.get("/all", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      var lotto_type_id = req.query.lotto_type_id;
      var number = req.query.number;
      if (lotto_type_id != null) {
        if (number != null) {
          var sql =
            "SELECT cn_id, number, type, remaining_limit, series, date_lotto, pay, pay2, pay3, pay4, pay5, buy_limit, buy_limit2, buy_limit3, buy_limit4, buy_limit5, (SELECT lotto_type_name FROM lotto_type WHERE lotto_type_id = cn.lotto_type_id) as lotto_type_name FROM close_number as cn WHERE lotto_type_id = ? AND number = ?";
          connection.query(
            sql,
            [lotto_type_id, number],
            (error, resultAll, fields) => {
              // if (result != "") {
              return res.status(200).send({ status: true, data: resultAll });
              // } else {
              //   return res.status(200).send({ status: false, data: result });
              // }
            }
          );
        } else {
          var sql =
            "SELECT cn_id, number, type, remaining_limit, series, date_lotto, pay, pay2, pay3, pay4, pay5, buy_limit, buy_limit2, buy_limit3, buy_limit4, buy_limit5, (SELECT lotto_type_name FROM lotto_type WHERE lotto_type_id = cn.lotto_type_id) as lotto_type_name FROM close_number as cn WHERE lotto_type_id = ?";
          connection.query(sql, [lotto_type_id], (error, resultAll, fields) => {
            // if (result != "") {
            return res.status(200).send({ status: true, data: resultAll });
            // } else {
            //   return res.status(200).send({ status: false, data: result });
            // }
          });
        }
      } else {
        // const sql =
        //   "SELECT number, type, date_lotto, pay (SELECT lotto_type_name FROM lotto_type WHERE lotto_type_id = cn.lotto_type_id ) as lotto_type_name FROM close_number as cn";
        // connection.query(sql, [lotto_type_id], (error, result, fields) => {
        //   // if (result != "") {
        //   return res.status(200).send({ status: true, data: result });
        //   // } else {
        //   //   return res.status(200).send({ status: false, data: result });
        //   // }
        // });
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาลือกประเภทหวย" });
      }
    } else {
      return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      var lotto_type_id = req.query.lotto_type_id;
      if (lotto_type_id != null) {
        var sql =
          "SELECT cn_id, number, type,(CASE WHEN buy_limit > 0 THEN buy_limit WHEN buy_limit2 > 0 THEN buy_limit2 WHEN buy_limit3 > 0 THEN buy_limit3 WHEN buy_limit4 > 0 THEN buy_limit4 ELSE buy_limit5 END) as buy_limit, (CASE WHEN series = 1 THEN pay WHEN series = 2 THEN pay2 WHEN series = 3 THEN pay3 WHEN series = 4 THEN pay4 ELSE pay5 END) as pay, (CASE WHEN buy_limit > 0 THEN 1 WHEN buy_limit2 > 0 THEN 2 WHEN buy_limit > 0 THEN 3 WHEN buy_limit > 0 THEN 4 ELSE 5 END) as series FROM close_number WHERE lotto_type_id = ?;";
        connection.query(sql, [lotto_type_id], (error, result, fields) => {
          return res.status(200).send({ status: true, data: result });
        });
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาลือกประเภทหวย" });
      }
    } else {
      return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

// router.post("/", verifyToken, (req, res) => {
//   jwt.verify(req.token, "secretkey", (err, data) => {
//     if (!err) {
//       var number = req.body.number;
//       var lotto_type_id = req.body.lotto_type_id;

//       if (number != undefined) {
//         // var sql =
//         //   "SELECT number, type, buy_limit, pay FROM close_number WHERE lotto_type_id = ?";
//         var sql =
//           "SELECT cn_id, number, type,(CASE WHEN buy_limit > 0 THEN buy_limit WHEN buy_limit2 > 0 THEN buy_limit2 WHEN buy_limit3 > 0 THEN buy_limit3 WHEN buy_limit4 > 0 THEN buy_limit4 ELSE buy_limit5 END) as buy_limit, (CASE WHEN buy_limit > 0 THEN pay WHEN buy_limit2 > 0 THEN pay2 WHEN buy_limit3 > 0 THEN pay3 WHEN buy_limit4 > 0 THEN pay4 ELSE pay5 END) as pay, (CASE WHEN buy_limit > 0 THEN 1 WHEN buy_limit2 > 0 THEN 2 WHEN buy_limit > 0 THEN 3 WHEN buy_limit > 0 THEN 4 ELSE 5 END) as series FROM close_number WHERE lotto_type_id = ?;";
//         connection.query(sql, [lotto_type_id], (error, result, fields) => {
//           const arr = [];
//           const openNumberArr = [];
//           if (result != "") {
//             number.forEach((item) => {
//               result.forEach((el) => {
//                 if (el.type == "3 ตัวโต๊ด") {
//                   let result6back = func6back(el.number);
//                   if (result6back.indexOf(item.number) != -1) {
//                     if (item.selected == el.type) {
//                       arr.push({ number: item.number, type: item.selected });
//                     }
//                   }
//                 } else {
//                   if (item.number == el.number && item.selected == el.type) {
//                     // if (el.buy_limit < 1) {
//                     arr.push({
//                       number: item.number,
//                       type: item.selected,
//                       limit: el.buy_limit,
//                       pay: el.pay,
//                     });
//                     // } else {
//                     //   openNumberArr.push({
//                     //     number: item.number,
//                     //     type: item.selected,
//                     //     limit: el.buy_limit,
//                     //   });
//                     // }
//                   }
//                 }
//               });
//             });
//             return res.status(200).send({
//               status: true,
//               data: arr,
//               // purchasable: openNumberArr,
//               msg: `เลขปิดรับ`,
//             });
//           } else {
//             return res.status(200).send({ status: false, data: result });
//           }
//         });
//       } else {
//         return res
//           .status(400)
//           .send({ status: false, msg: "กรุณาส่ง number, lotto_type_id" });
//       }
//     } else {
//       return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
//     }
//   });
// });

// router.post("/add-close-number", verifyToken, (req, res) => {
//   jwt.verify(req.token, "secretkey", (err, data) => {
//     if (!err) {
//       const lotto_type_id = req.body.lotto_type_id;
//       const number = req.body.number;
//       const type = req.body.type;
//       const pay = req.body.pay;
//       const pay2 = req.body.pay2;
//       const pay3 = req.body.pay3;
//       const pay4 = req.body.pay4;
//       const pay5 = req.body.pay5;
//       const buy_limit = req.body.buy_limit;
//       const buy_limit2 = req.body.buy_limit2;
//       const buy_limit3 = req.body.buy_limit3;
//       const buy_limit4 = req.body.buy_limit4;
//       const buy_limit5 = req.body.buy_limit5;
//       const allNumber = req.body.allNumber;
//       if (
//         lotto_type_id != null &&
//         number != null &&
//         type != null &&
//         type != ""
//       ) {
//         var sql = "SELECT * FROM lotto_type WHERE lotto_type_id = ?";
//         connection.query(sql, [lotto_type_id], (error, result, fields) => {
//           if (result.length > 0) {
//             var d = moment(new Date(result[0].closing_time)).format(
//               "YYYY-MM-DD"
//             );
//             // console.log(type.substr(0, 1));
//             let chkType = type.substr(0, 1);
//             if (allNumber === "1") {
//               if (chkType === "2") {
//                 for (i = 0; i < 100; i++) {
//                   if (i < 10) {
//                     i = `0${i}`;
//                   } else {
//                     i = `${i}`;
//                   }
//                   var sql =
//                     "INSERT INTO close_number (lotto_type_id, number, type, pay, pay2, pay3, pay4, pay5, buy_limit, buy_limit2, buy_limit3, buy_limit4, buy_limit5, date_lotto) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
//                   connection.query(
//                     sql,
//                     [
//                       lotto_type_id,
//                       i,
//                       type,
//                       pay,
//                       pay2,
//                       pay3,
//                       pay4,
//                       pay5,
//                       buy_limit,
//                       buy_limit2,
//                       buy_limit3,
//                       buy_limit4,
//                       buy_limit5,
//                       d,
//                     ],
//                     (error, result, fields) => {}
//                   );
//                 }
//               } else if (chkType === "3") {
//                 for (i = 0; i < 1000; i++) {
//                   if (i < 10) {
//                     i = `00${i}`;
//                   } else if (i < 100) {
//                     i = `0${i}`;
//                   } else {
//                     i = `${i}`;
//                   }
//                   var sql =
//                     "INSERT INTO close_number (lotto_type_id, number, type, pay, pay2, pay3, pay4, pay5, buy_limit, buy_limit2, buy_limit3, buy_limit4, buy_limit5, date_lotto) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
//                   connection.query(
//                     sql,
//                     [
//                       lotto_type_id,
//                       i,
//                       type,
//                       pay,
//                       pay2,
//                       pay3,
//                       pay4,
//                       pay5,
//                       buy_limit,
//                       buy_limit2,
//                       buy_limit3,
//                       buy_limit4,
//                       buy_limit5,
//                       d,
//                     ],
//                     (error, result, fields) => {}
//                   );
//                 }
//               } else {
//                 for (i = 0; i < 10000; i++) {
//                   if (i < 10) {
//                     i = `000${i}`;
//                   } else if (i < 100) {
//                     i = `00${i}`;
//                   } else if (i < 1000) {
//                     i = `0${i}`;
//                   } else {
//                     i = `${i}`;
//                   }
//                   var sql =
//                     "INSERT INTO close_number (lotto_type_id, number, type, pay, pay2, pay3, pay4, pay5, buy_limit, buy_limit2, buy_limit3, buy_limit4, buy_limit5, date_lotto) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
//                   connection.query(
//                     sql,
//                     [
//                       lotto_type_id,
//                       i,
//                       type,
//                       pay,
//                       pay2,
//                       pay3,
//                       pay4,
//                       pay5,
//                       buy_limit,
//                       buy_limit2,
//                       buy_limit3,
//                       buy_limit4,
//                       buy_limit5,
//                       d,
//                     ],
//                     (error, result, fields) => {}
//                   );
//                 }
//               }
//             } else {
//               number.forEach((item) => {
//                 var sql =
//                   "INSERT INTO close_number (lotto_type_id, number, type, pay, pay2, pay3, pay4, pay5, buy_limit, buy_limit2, buy_limit3, buy_limit4, buy_limit5, date_lotto) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
//                 connection.query(
//                   sql,
//                   [
//                     lotto_type_id,
//                     item,
//                     type,
//                     pay,
//                     pay2,
//                     pay3,
//                     pay4,
//                     pay5,
//                     buy_limit,
//                     buy_limit2,
//                     buy_limit3,
//                     buy_limit4,
//                     buy_limit5,
//                     d,
//                   ],
//                   (error, result, fields) => {}
//                 );
//               });
//             }

//             return res
//               .status(200)
//               .send({ status: true, msg: "เพิ่มเลขปิดรับสำเร็จ" });
//           } else {
//             return res
//               .status(400)
//               .send({ status: false, msg: "ไม่พบประเภทหวยนี้" });
//           }
//         });
//       } else {
//         return res
//           .status(400)
//           .send({ status: false, msg: "กรุณาส่ง lotto_type_id, number, type" });
//       }
//     } else {
//       res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
//     }
//   });
// });

router.post("/add-close-number", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, data) => {
    if (err)
      return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });

    const {
      lotto_type_id,
      number,
      type,
      pay,
      pay2,
      pay3,
      pay4,
      pay5,
      buy_limit,
      buy_limit2,
      buy_limit3,
      buy_limit4,
      buy_limit5,
      allNumber,
    } = req.body;

    if (!lotto_type_id || !type) {
      return res
        .status(400)
        .send({ status: false, msg: "กรุณาส่ง lotto_type_id, number, type" });
    }

    const sql = "SELECT * FROM lotto_type WHERE lotto_type_id = ?";
    connection.query(sql, [lotto_type_id], async (error, result) => {
      if (error || result.length === 0) {
        return res
          .status(400)
          .send({ status: false, msg: "ไม่พบประเภทหวยนี้" });
      }

      const d = moment(new Date(result[0].closing_time)).format("YYYY-MM-DD");
      const values = [];
      const baseValues = [
        lotto_type_id,
        type,
        pay,
        pay2,
        pay3,
        pay4,
        pay5,
        buy_limit,
        buy_limit2,
        buy_limit3,
        buy_limit4,
        buy_limit5,
        d,
        buy_limit,
      ];

      if (allNumber === "1") {
        let max = 100; // Default 2 ตัว
        if (type.startsWith("3")) max = 1000;
        else if (!type.startsWith("2")) max = 10000;

        for (let i = 0; i < max; i++) {
          const num = i
            .toString()
            .padStart(
              type.startsWith("2") ? 2 : type.startsWith("3") ? 3 : 4,
              "0"
            );
          values.push([lotto_type_id, num, ...baseValues.slice(1)]);
        }
      } else {
        number.forEach((num) => {
          values.push([lotto_type_id, num, ...baseValues.slice(1)]);
        });
      }

      if (values.length === 0) {
        return res
          .status(400)
          .send({ status: false, msg: "ไม่มีเลขที่จะเพิ่ม" });
      }

      const insertSql = `
        INSERT INTO close_number 
        (lotto_type_id, number, type, pay, pay2, pay3, pay4, pay5, buy_limit, buy_limit2, buy_limit3, buy_limit4, buy_limit5, date_lotto, remaining_limit) 
        VALUES ?
      `;

      connection.query(insertSql, [values], (err) => {
        if (err) {
          console.error("Insert Error:", err);
          return res
            .status(500)
            .send({ status: false, msg: "เกิดข้อผิดพลาดขณะเพิ่มเลขปิดรับ" });
        }

        return res
          .status(200)
          .send({ status: true, msg: "เพิ่มเลขปิดรับสำเร็จ" });
      });
    });
  });
});

router.delete("/delete-close-number", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const lotto_type_id = req.body.lotto_type_id;
      // const number = req.body.number;
      const cn_id = req.body.cn_id;
      const type = req.body.type;
      var sql = "";
      if (lotto_type_id != null) {
        if (lotto_type_id != null && type != null) {
          sql = `DELETE FROM close_number WHERE lotto_type_id = '${lotto_type_id}' AND type = '${type}'`;
        } else {
          sql = `DELETE FROM close_number WHERE lotto_type_id = '${lotto_type_id}'`;
        }
      } else if (cn_id != null) {
        sql = `DELETE FROM close_number WHERE cn_id = '${cn_id}'`;
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง ประเภทหวย, ประเภทเลข ให้ครบ" });
      }
      connection.query(sql, [], (error, result, fields) => {
        return res.status(200).send({ status: true, msg: "ลบเลขปิดรับสำเร็จ" });
        // if (result.length > 0) {
        //   var d = moment(new Date(result[0].closing_time)).format("YYYY-MM-DD");
        //   number.forEach((item) => {
        //     var sql =
        //       "INSERT INTO close_number (lotto_type_id, number, type, date_lotto) VALUES(?, ?, ?, ?)";
        //     connection.query(
        //       sql,
        //       [lotto_type_id, item, type, d],
        //       (error, result, fields) => {
        //
        //       }
        //     );
        //   });
        //   return res
        //     .status(200)
        //     .send({ status: true, msg: "เพิ่มเลขปิดรับสำเร็จ" });
        // } else {
        //   return res
        //     .status(400)
        //     .send({ status: false, msg: "ไม่พบประเภทหวยนี้" });
        // }
      });
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.put("/edit-close-number", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      // const lotto_type_id = req.body.lotto_type_id;
      // const number = req.body.number;
      const cn_id = req.body.cn_id;
      const pay = req.body.pay;
      const pay2 = req.body.pay2;
      const pay3 = req.body.pay3;
      const pay4 = req.body.pay4;
      const pay5 = req.body.pay5;
      const buy_limit = req.body.buy_limit;
      const buy_limit2 = req.body.buy_limit2;
      const buy_limit3 = req.body.buy_limit3;
      const buy_limit4 = req.body.buy_limit4;
      const buy_limit5 = req.body.buy_limit5;
      var sql = "";
      if (cn_id != null) {
        sql =
          "UPDATE close_number SET pay = ?, pay2 = ?, pay3 = ?, pay4 = ?, pay5 = ?, buy_limit = ?, buy_limit2 = ?, buy_limit3 = ?, buy_limit4 = ?, buy_limit5 = ? WHERE cn_id = ?";
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง รหัสเลขปิดรับ" });
      }
      connection.query(
        sql,
        [
          pay,
          pay2,
          pay3,
          pay4,
          pay5,
          buy_limit,
          buy_limit2,
          buy_limit3,
          buy_limit4,
          buy_limit5,
          cn_id,
        ],
        (error, result, fields) => {
          return res
            .status(200)
            .send({ status: true, msg: "แก้ไขเลขปิดรับสำเร็จ" });
        }
      );
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

module.exports = router;
