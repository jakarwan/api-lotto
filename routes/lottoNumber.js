const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");
const moment = require("moment");
const {
  lottoNumberInsert,
  closeLottoNumberUpdate,
  maxPlayUpdate,
} = require("../routes/sql/lottoNumber");

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      //   const page = req.query.page;
      //   const perPage = req.query.perPage;
      // const lotto_type_id = req.query.lotto_type_id;
      var now = moment(new Date()).format("YYYY-MM-DD");
      // if (lotto_type_id != null) {
      //   var sql =
      //     "SELECT p.*, lt.lotto_type_name, (SELECT ROUND(SUM(pay * price)) FROM lotto_number WHERE poy_code = p.poy_code AND status = 'suc') as totalPrize FROM poy as p JOIN lotto_type as lt ON p.lotto_type_id = lt.lotto_type_id WHERE lt.lotto_type_id = ? ORDER BY p.created_at DESC";
      //   connection.query(sql, [lotto_type_id], (error, result, fields) => {
      //     if (result === undefined) {
      //       return res.status(400).send({ status: false });
      //     } else {
      //       return res.status(200).send({ status: true, data: result });
      //     }
      //   });
      // } else {
      var sql = `SELECT 
  p.*, 
  lt.lotto_type_name, 
  IFNULL(SUM(ln.pay * ln.price), 0) AS totalPrize
FROM 
  poy AS p
JOIN 
  lotto_type AS lt ON p.lotto_type_id = lt.lotto_type_id
LEFT JOIN 
  lotto_number AS ln ON p.poy_code = ln.poy_code AND ln.status = 'suc'
WHERE 
  p.created_by = ?
GROUP BY 
  p.poy_id
ORDER BY 
  p.created_at DESC;`;
      connection.query(sql, [data.user.id], (error, result, fields) => {
        if (result === undefined) {
          return res.status(400).send({ status: false });
        } else {
          var sql =
            "SELECT IFNULL(SUM(total), 0) as sum_total FROM poy WHERE status = 'SUC' AND created_by = ?";
          connection.query(
            sql,
            [data.user.id],
            (error, resultSumTotal, fields) => {
              var sql =
                "SELECT IFNULL(SUM(total), 0) as sum_total FROM poy WHERE status = 'SUC' AND status_result = 1 AND created_by = ?";
              connection.query(
                sql,
                [data.user.id],
                (error, resultSumResultTrue, fields) => {
                  var sql =
                    "SELECT IFNULL(SUM(total), 0) as sum_total FROM poy WHERE status = 'SUC' AND status_result = 0 AND created_by = ?";
                  connection.query(
                    sql,
                    [data.user.id],
                    (error, resultSumResultFalse, fields) => {
                      return res.status(200).send({
                        status: true,
                        data: result,
                        sum_total: resultSumTotal[0].sum_total,
                        resultSumResultTrue: resultSumResultTrue[0].sum_total,
                        resultSumResultFalse: resultSumResultFalse[0].sum_total,
                      });
                    }
                  );
                }
              );
            }
          );
        }
      });
      // }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/bill", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      //   const page = req.query.page;
      //   const perPage = req.query.perPage;
      var now = moment(new Date()).format("YYYY-MM-DD");
      var sql =
        "SELECT p.*, lt.lotto_type_name, (SELECT SUM(pay * price) FROM lotto_number WHERE poy_code = p.poy_code AND status = 'suc') as totalPrize FROM poy as p JOIN lotto_type as lt ON p.lotto_type_id = lt.lotto_type_id WHERE p.created_by = ? AND p.status_result = 0 ORDER BY p.created_at DESC LIMIT 20";
      connection.query(sql, [data.user.id], (error, result, fields) => {
        if (result === undefined) {
          return res.status(400).send({ status: false });
        } else {
          return res.status(200).send({ status: true, data: result });
        }
      });
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/detail", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      //   const page = req.query.page;
      var billId = req.query.billId;
      // var lotto_type_id = req.query.lotto_type_id;
      if (billId) {
        var sql =
          "SELECT *, ( SELECT p.prize3top FROM prize as p WHERE p.prize_time = ln.installment_date AND p.lotto_type_id = ln.lotto_type_id ORDER BY p.prize_id DESC LIMIT 1) as prize_3top, ( SELECT p.prize2bottom FROM prize as p WHERE p.prize_time = ln.installment_date AND p.lotto_type_id = ln.lotto_type_id ORDER BY p.prize_id DESC LIMIT 1) as prize_2bottom FROM lotto_number as ln WHERE ln.poy_code = ? AND ln.created_by = ?";
        connection.query(
          sql,
          [billId, data.user.id],
          (error, result, fields) => {
            let totalPrice = 0;
            let totalDiscountPrice = 0;
            let prize = 0;
            let total = 0;
            result.forEach((item) => {
              // if (item.number == el.number && item.selected == el.type) {
              if (item.status != "close") {
                totalPrice += item.price;
                totalDiscountPrice += item.discount;
                total += item.price - item.discount;
              }
              if (item.status === "suc") {
                prize += item.price * item.pay;
              }
              // }
            });
            // });
            //   }
            // );

            if (result == "") {
              return res
                .status(400)
                .send({ status: false, msg: "ไม่พบรหัสโพยนี้" });
            } else {
              return res.status(200).send({
                status: true,
                data: result,
                totalprice: totalPrice,
                totalDiscountPrice: totalDiscountPrice,
                prize: prize,
                total: total,
              });
            }
          }
        );
      } else {
        return res.status(400).send({ status: false, msg: "กรุณาส่งโพย ID" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

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

// router.post("/add-lotto", verifyToken, (req, res) => {
//   jwt.verify(req.token, "secretkey", (err, data) => {
//     if (!err) {
//       const number = req.body.number;
//       const note = req.body.note;
//       const lotto_type_id = req.body.lotto_type_id;
//       if (number != "") {
//         if (lotto_type_id) {
//           var sql =
//             "SELECT * FROM lotto_type WHERE lotto_type_id = ? AND open = 1 AND active = 1";
//           connection.query(
//             sql,
//             [lotto_type_id],
//             (error, resultTypeLotto, fields) => {
//               if (resultTypeLotto.length > 0) {
//                 var dateNow = moment(
//                   new Date(resultTypeLotto[0].closing_time)
//                 ).format("YYYY-MM-DD");

//                 let totalPrice = 0;
//                 let totalDiscountPrice = 0;
//                 let grandTotal = 0;
//                 let affAmount = 0;
//                 let totalLimit = 0;
//                 const arrClose = [];
//                 var sql =
//                   "SELECT cn_id, number, type,(CASE WHEN buy_limit > 0 THEN buy_limit WHEN buy_limit2 > 0 THEN buy_limit2 WHEN buy_limit3 > 0 THEN buy_limit3 WHEN buy_limit4 > 0 THEN buy_limit4 ELSE buy_limit5 END) as buy_limit, (CASE WHEN buy_limit > 0 THEN pay WHEN buy_limit2 > 0 THEN pay2 WHEN buy_limit3 > 0 THEN pay3 WHEN buy_limit4 > 0 THEN pay4 ELSE pay5 END) as pay, (CASE WHEN buy_limit > 0 THEN 1 WHEN buy_limit2 > 0 THEN 2 WHEN buy_limit3 > 0 THEN 3 WHEN buy_limit4 > 0 THEN 4 ELSE 5 END) as series FROM close_number WHERE lotto_type_id = ?;";
//                 connection.query(
//                   sql,
//                   [lotto_type_id],
//                   (error, resultCloseNumber, fields) => {
//                     number.forEach((item) => {
//                       if (resultCloseNumber != "") {
//                         var close = resultCloseNumber.filter(
//                           (el) =>
//                             (el.number == item.number &&
//                               el.type == item.selected &&
//                               el.buy_limit < item.price) ||
//                             el.pay < 0
//                         );
//                         if (close == "") {
//                           totalPrice += parseFloat(item.price);
//                           totalDiscountPrice += parseFloat(item.discount);
//                           grandTotal +=
//                             parseFloat(item.price) - parseFloat(item.discount);
//                         } else {
//                           arrClose.push(close[0]);
//                         }
//                       } else {
//                         totalPrice += parseFloat(item.price);
//                         // totalDiscountPrice += parseFloat(item.discount);
//                         if (item.selected == "วิ่งบน") {
//                           grandTotal += parseFloat(item.price);
//                           totalDiscountPrice = 0;
//                         } else if (item.selected == "วิ่งล่าง") {
//                           grandTotal += parseFloat(item.price);
//                           totalDiscountPrice = 0;
//                         } else {
//                           totalDiscountPrice += parseFloat(item.discount);
//                           grandTotal +=
//                             parseFloat(item.price) - parseFloat(item.discount);
//                         }
//                       }
//                     });
//                     console.log(arrClose, "arrClose");
//                     if (arrClose == "") {
//                       connection.query(
//                         `SELECT credit_balance, is_active, refs_code, phone, max_limit, max_play FROM member WHERE id = ?`,
//                         [data.user.id],
//                         async (error, resultBalance, fields) => {
//                           if (resultBalance[0].is_active != 0) {
//                             if (
//                               resultBalance[0].credit_balance >=
//                               parseFloat(grandTotal)
//                             ) {
//                               if (
//                                 parseFloat(grandTotal) <=
//                                 resultBalance[0].max_limit
//                               ) {
//                                 if (resultBalance[0].max_play > 0) {
//                                   var sumLimit = resultBalance[0].max_play - 1;
//                                   console.log(sumLimit, "data.user.id");
//                                   var params = [sumLimit, data.user.id];
//                                   const updateMaxPlay = await maxPlayUpdate(
//                                     params
//                                   );
//                                   connection.query(
//                                     `SELECT MAX(poy_id) as id FROM poy`,
//                                     (error, resultMax, fields) => {
//                                       let maxId = resultMax[0].id + 1;
//                                       connection.query(
//                                         "INSERT INTO poy (poy_code, price, discount, total, note, lotto_type_id, created_by, lotto_total, installment_date, date_lotto) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, curdate())",
//                                         [
//                                           `BILL${maxId}`,
//                                           totalPrice,
//                                           totalDiscountPrice,
//                                           grandTotal,
//                                           note,
//                                           lotto_type_id,
//                                           data.user.id,
//                                           number.length,
//                                           dateNow,
//                                         ],
//                                         (error, resultInsertBill, fields) => {
//                                           let close = "wait";
//                                           number.forEach(async (item) => {
//                                             if (resultCloseNumber != "") {
//                                               if (
//                                                 item.selected == "3 ตัวโต๊ด"
//                                               ) {
//                                                 let result6back = func6back(
//                                                   item.number
//                                                 );

//                                                 resultCloseNumber.forEach(
//                                                   (el) => {
//                                                     if (
//                                                       el.type == "3 ตัวโต๊ด"
//                                                     ) {
//                                                       if (
//                                                         result6back.indexOf(
//                                                           el.number
//                                                         ) != -1
//                                                       ) {
//                                                         close = "close";
//                                                       }
//                                                     }
//                                                   }
//                                                 );
//                                               }
//                                               var params = [
//                                                 item.number,
//                                                 item.selected,
//                                                 item.price,
//                                                 item.pay,
//                                                 item.discount,
//                                                 parseFloat(item.price) -
//                                                   parseFloat(item.discount),
//                                                 lotto_type_id,
//                                                 data.user.id,
//                                                 `BILL${maxId}`,
//                                                 close,
//                                                 dateNow,
//                                               ];
//                                               const insertLotto =
//                                                 await lottoNumberInsert(params);
//                                               resultCloseNumber.forEach(
//                                                 async (el) => {
//                                                   if (
//                                                     el.number == item.number &&
//                                                     el.type == item.selected
//                                                   ) {
//                                                     let updateField = null;
//                                                     if (
//                                                       item.price <= el.buy_limit
//                                                     ) {
//                                                       if (el.series === 1) {
//                                                         updateField =
//                                                           "buy_limit";
//                                                       } else {
//                                                         updateField =
//                                                           "buy_limit" +
//                                                           el.series;
//                                                       }
//                                                       totalLimit =
//                                                         el.buy_limit -
//                                                         parseFloat(item.price);
//                                                     }
//                                                     var params = [
//                                                       totalLimit,
//                                                       el.cn_id,
//                                                     ];
//                                                     const updateCloseLotto =
//                                                       await closeLottoNumberUpdate(
//                                                         updateField,
//                                                         params
//                                                       );
//                                                   }
//                                                 }
//                                               );
//                                             } else {
//                                               if (
//                                                 item.number != null &&
//                                                 item.selected != null &&
//                                                 item.price != null &&
//                                                 item.pay != null &&
//                                                 item.discount != null
//                                               ) {
//                                                 var params = [
//                                                   item.number,
//                                                   item.selected,
//                                                   item.price,
//                                                   item.pay,
//                                                   item.discount,
//                                                   parseFloat(item.price) -
//                                                     parseFloat(item.discount),
//                                                   lotto_type_id,
//                                                   data.user.id,
//                                                   `BILL${maxId}`,
//                                                   close,
//                                                   dateNow,
//                                                 ];
//                                                 const insertLotto =
//                                                   await lottoNumberInsert(
//                                                     params
//                                                   );
//                                                 resultCloseNumber.forEach(
//                                                   async (el) => {
//                                                     if (
//                                                       el.number ==
//                                                         item.number &&
//                                                       el.type == item.selected
//                                                     ) {
//                                                       let updateField = null;
//                                                       if (
//                                                         item.price <=
//                                                         el.buy_limit
//                                                       ) {
//                                                         if (el.series === 1) {
//                                                           updateField =
//                                                             "buy_limit";
//                                                         } else {
//                                                           updateField =
//                                                             "buy_limit" +
//                                                             el.series;
//                                                         }
//                                                         totalLimit =
//                                                           el.buy_limit -
//                                                           parseFloat(
//                                                             item.price
//                                                           );
//                                                       }
//                                                       var params = [
//                                                         totalLimit,
//                                                         el.cn_id,
//                                                       ];
//                                                       const updateCloseLotto =
//                                                         await closeLottoNumberUpdate(
//                                                           updateField,
//                                                           params
//                                                         );
//                                                     }
//                                                   }
//                                                 );
//                                               }
//                                             }
//                                           });
//                                           let grandTotalPrice = 0;

//                                           grandTotalPrice =
//                                             resultBalance[0].credit_balance -
//                                             grandTotal;
//                                           connection.query(
//                                             "UPDATE member SET credit_balance = ? WHERE id = ?",
//                                             [grandTotalPrice, data.user.id],
//                                             (error, resultUpdate, fields) => {
//                                               /////////////// affiliate ////////////////
//                                               connection.query(
//                                                 `SELECT * FROM affiliate WHERE aff_code = ?`,
//                                                 [resultBalance[0].phone],
//                                                 (error, resultAff, fields) => {
//                                                   if (resultAff != "") {
//                                                     connection.query(
//                                                       `SELECT aff_percentage FROM member WHERE refs_code = ?`,
//                                                       [resultAff[0].refs_code],
//                                                       (
//                                                         error,
//                                                         resultAffPercentage,
//                                                         fields
//                                                       ) => {
//                                                         if (
//                                                           resultAffPercentage.length !=
//                                                           0
//                                                         ) {
//                                                           if (
//                                                             totalDiscountPrice >
//                                                             0
//                                                           ) {
//                                                             affAmount =
//                                                               (totalPrice *
//                                                                 resultAffPercentage[0]
//                                                                   .aff_percentage) /
//                                                               100 /
//                                                               2;
//                                                           } else if (
//                                                             totalDiscountPrice ==
//                                                             0
//                                                           ) {
//                                                             affAmount =
//                                                               (totalPrice *
//                                                                 resultAffPercentage[0]
//                                                                   .aff_percentage) /
//                                                               100;
//                                                           }
//                                                         }
//                                                         var now = moment(
//                                                           new Date()
//                                                         ).format("YYYY-MM-DD");
//                                                         var sql =
//                                                           "INSERT INTO aff_log (refs_code, amount, poy_code, lotto_type_id, user_id, aff_amount, aff_date) VALUES(?, ?, ?, ?, ?, ?, ?)";
//                                                         connection.query(
//                                                           sql,
//                                                           [
//                                                             resultAff[0]
//                                                               .refs_code,
//                                                             totalPrice,
//                                                             `BILL${maxId}`,
//                                                             lotto_type_id,
//                                                             data.user.id,
//                                                             affAmount,
//                                                             now,
//                                                           ],
//                                                           (
//                                                             error,
//                                                             result,
//                                                             fields
//                                                           ) => {
//                                                             connection.query(
//                                                               `SELECT credit_balance, is_active, refs_code FROM member WHERE phone = ?`,
//                                                               [
//                                                                 resultAff[0]
//                                                                   .refs_code,
//                                                               ],
//                                                               (
//                                                                 error,
//                                                                 resultBalanceHead,
//                                                                 fields
//                                                               ) => {
//                                                                 if (error)
//                                                                   throw error;
//                                                                 if (
//                                                                   resultBalanceHead.length !=
//                                                                   0
//                                                                 ) {
//                                                                   let creditBalanceHead =
//                                                                     resultBalanceHead[0]
//                                                                       .credit_balance +
//                                                                     affAmount;
//                                                                   connection.query(
//                                                                     "UPDATE member SET credit_balance = ? WHERE phone = ?",
//                                                                     [
//                                                                       creditBalanceHead,
//                                                                       resultAff[0]
//                                                                         .refs_code,
//                                                                     ],
//                                                                     (
//                                                                       error,
//                                                                       resultUpdate,
//                                                                       fields
//                                                                     ) => {
//                                                                       if (error)
//                                                                         throw error;
//                                                                     }
//                                                                   );
//                                                                 }
//                                                               }
//                                                             );
//                                                           }
//                                                         );
//                                                       }
//                                                     );
//                                                   }
//                                                 }
//                                               );
//                                             }
//                                           );
//                                           return res.status(200).send({
//                                             status: true,
//                                             msg: "เพิ่มหวยสำเร็จ",
//                                             data: arrClose,
//                                           });
//                                         }
//                                       );
//                                     }
//                                   );
//                                 } else {
//                                   return res.status(400).send({
//                                     status: false,
//                                     msg: `จำนวนการแทงวันนี้ครบแล้ว ไม่สามารถแทงได้อีก`,
//                                   });
//                                 }
//                               } else {
//                                 return res.status(400).send({
//                                   status: false,
//                                   msg: `ยอดแทงต้องไม่เกิน ${resultBalance[0].max_limit} / ครั้ง`,
//                                 });
//                               }
//                             } else {
//                               return res.status(400).send({
//                                 status: false,
//                                 msg: "ยอดเงินของคุณไม่พอ",
//                               });
//                             }
//                           } else {
//                             return res.status(400).send({
//                               status: false,
//                               msg: "เกิดข้อผิดพลาดคุณไม่มีสิทธ์ในการซื้อ คุณถูกแบน",
//                             });
//                           }
//                         }
//                       );
//                     } else {
//                       return res.status(400).send({
//                         status: false,
//                         msg: `มีเลขปิดรับ\n${arrClose
//                           .map(
//                             (item) =>
//                               `${item.number} ประเภท ${item.type} ซื้อได้แค่ ${item.buy_limit} บาท เรทจ่าย ${item.pay}`
//                           )
//                           .join(", ")}`,
//                         data: arrClose,
//                       });
//                     }
//                   }
//                 );
//               } else {
//                 return res.status(400).send({
//                   status: false,
//                   msg: "หวยนี้ปิดรับแทง",
//                 });
//               }
//             }
//           );
//         } else {
//           return res.status(400).send({
//             status: false,
//             msg: "กรุณาส่ง ประเภทหวย(lotto_type_id)",
//           });
//         }
//       } else {
//         return res.status(400).send({ status: false, msg: "กรุณากรอกเลขหวย" });
//       }
//     } else {
//       res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
//     }
//   });
// });

router.post("/add-lotto", verifyToken, async (req, res) => {
  const conn = await connection.promise().getConnection();
  await conn.beginTransaction();
  try {
    const decoded = jwt.verify(req.token, "secretkey");
    const { number, note, lotto_type_id } = req.body;

    if (!number || !lotto_type_id) {
      return res
        .status(400)
        .json({ status: false, msg: "กรุณากรอกข้อมูลให้ครบ" });
    }

    const [[lottoType]] = await conn.query(
      "SELECT * FROM lotto_type WHERE lotto_type_id = ? AND open = 1 AND active = 1",
      [lotto_type_id]
    );

    if (!lottoType) {
      await conn.rollback();
      return res.status(400).json({ status: false, msg: "หวยนี้ปิดรับแทง" });
    }

    const [lottoTypeOption] = await conn.query(
      "SELECT * FROM type_options WHERE type_id = ?",
      [lottoType.type_id]
    );

    const dateNow = moment(lottoType.closing_time).format("YYYY-MM-DD");

    const [closeNumbers] = await conn.query(
      `SELECT cn_id, number, type, 
        CASE WHEN buy_limit > 0 THEN buy_limit 
             WHEN buy_limit2 > 0 THEN buy_limit2 
             WHEN buy_limit3 > 0 THEN buy_limit3 
             WHEN buy_limit4 > 0 THEN buy_limit4 
             ELSE buy_limit5 END AS buy_limit,
        CASE WHEN buy_limit > 0 THEN pay 
             WHEN buy_limit2 > 0 THEN pay2 
             WHEN buy_limit3 > 0 THEN pay3 
             WHEN buy_limit4 > 0 THEN pay4 
             ELSE pay5 END AS pay,
        CASE WHEN buy_limit > 0 THEN 1
             WHEN buy_limit2 > 0 THEN 2 
             WHEN buy_limit3 > 0 THEN 3
             WHEN buy_limit4 > 0 THEN 4
             ELSE 5 END as series
      FROM close_number 
      WHERE lotto_type_id = ?`,
      [lotto_type_id]
    );

    let totalPrice = 0;
    let totalDiscountPrice = 0;
    let grandTotal = 0;
    const arrClose = [];

    for (const item of number) {
      const closed = closeNumbers.find(
        (c) =>
          c.number == item.number &&
          c.type == item.selected &&
          (c.buy_limit < item.price || c.pay < 0)
      );
      if (closed) {
        arrClose.push(closed);
      } else {
        totalPrice += parseFloat(item.price);
        totalDiscountPrice += parseFloat(item.discount);
        grandTotal += parseFloat(item.price) - parseFloat(item.discount);
      }
    }

    if (arrClose.length > 0) {
      await conn.rollback();
      return res.status(400).json({
        status: false,
        msg: `มีเลขปิดรับ\n${arrClose
          .map((item) => `${item.number} ${item.type}`)
          .join(", ")}`,
        data: arrClose,
      });
    }

    const [[user]] = await conn.query(
      "SELECT credit_balance, is_active, refs_code, phone, max_limit, max_play FROM member WHERE id = ?",
      [decoded.user.id]
    );

    if (user.is_active == 0) {
      await conn.rollback();
      return res
        .status(400)
        .json({ status: false, msg: "คุณถูกแบนจากการใช้งาน" });
    }

    if (user.credit_balance < grandTotal) {
      await conn.rollback();
      return res.status(400).json({ status: false, msg: "เครดิตไม่เพียงพอ" });
    }

    if (grandTotal > user.max_limit) {
      await conn.rollback();
      return res.status(400).json({
        status: false,
        msg: `ยอดแทงต้องไม่เกิน ${user.max_limit} บาท`,
      });
    }

    if (user.max_play <= 0) {
      await conn.rollback();
      return res
        .status(400)
        .json({ status: false, msg: `จำนวนครั้งในการแทงครบแล้ว` });
    }

    // update max_play
    await conn.query("UPDATE member SET max_play = max_play - 1 WHERE id = ?", [
      decoded.user.id,
    ]);

    // สร้าง bill_code แบบ timestamp ป้องกันซ้ำ
    // const billCode = `BILL${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const billCode = `BILL${Math.floor(
      10000000 + Math.random() * 90000000
    ).toString()}`;

    const [insertPoyResult] = await conn.query(
      "INSERT INTO poy (poy_code, price, discount, total, note, lotto_type_id, created_by, lotto_total, installment_date, date_lotto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())",
      [
        billCode,
        totalPrice,
        totalDiscountPrice,
        grandTotal,
        note,
        lotto_type_id,
        decoded.user.id,
        number.length,
        dateNow,
      ]
    );

    // insert lotto_number
    for (const item of number) {
      const [pay] = lottoTypeOption.filter((el) => el.name === item.selected);
      await conn.query(
        "INSERT INTO lotto_number (number, type_option, price, pay, discount, total, lotto_type_id, created_by, poy_code, status, installment_date, date_lotto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())",
        [
          item.number,
          item.selected,
          item.price,
          pay.price,
          item.discount,
          parseFloat(item.price) - parseFloat(item.discount),
          lotto_type_id,
          decoded.user.id,
          billCode,
          "wait",
          dateNow,
        ]
      );

      // เพิ่มอัปเดต close_number
      const closedItem = closeNumbers.find(
        (el) => el.number === item.number && el.type === item.selected
      );

      if (closedItem) {
        let updateField = null;
        let totalLimit = 0;

        if (item.price <= closedItem.buy_limit) {
          const series = closedItem.series || 1;
          updateField = series === 1 ? "buy_limit" : `buy_limit${series}`;
          totalLimit = closedItem.buy_limit - parseFloat(item.price);

          await conn.query(
            `UPDATE close_number SET ${updateField} = ? WHERE cn_id = ?`,
            [totalLimit, closedItem.cn_id]
          );
        }
      }
    }

    // อัปเดตเครดิตหลังแทง
    const creditBefore = user.credit_balance;
    const creditAfter = user.credit_balance - grandTotal;

    await conn.query("UPDATE member SET credit_balance = ? WHERE id = ?", [
      creditAfter,
      decoded.user.id,
    ]);

    // เพิ่มเข้า credit_log
    await conn.query(
      `INSERT INTO credit_log (credit_previous, credit_after, created_by, lotto_type_id, note, installment, ref_code, poy_code) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        creditBefore,
        creditAfter,
        decoded.user.id,
        lotto_type_id,
        `แทงหวย ${grandTotal} บาท (${billCode})`,
        dateNow,
        "",
        billCode,
      ]
    );

    // 🧡 Affiliate system (ถ้ามี refs_code)
    // if (user.refs_code) {
    //   const [[refUser]] = await conn.query(
    //     "SELECT id, credit_balance FROM member WHERE refs_code = ?",
    //     [user.refs_code]
    //   );

    //   if (refUser) {
    //     // คิดคอมมิชชั่น (ตัวอย่างให้ 2%)
    //     const affiliatePercent = 2; // เปอร์เซ็นต์
    //     const affiliateBonus = (grandTotal * affiliatePercent) / 100;

    //     const refCreditBefore = refUser.credit_balance;
    //     const refCreditAfter = refUser.credit_balance + affiliateBonus;

    //     await conn.query("UPDATE member SET credit_balance = ? WHERE id = ?", [
    //       refCreditAfter,
    //       refUser.id,
    //     ]);

    //     // บันทึกเข้า credit_log ว่าได้ค่าคอม
    //     await conn.query(
    //       `INSERT INTO credit_log (credit_previous, credit_after, created_by, lotto_type_id, note, installment, ref_code, poy_code)
    //        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    //       [
    //         refCreditBefore,
    //         refCreditAfter,
    //         refUser.id,
    //         lotto_type_id,
    //         `ค่าคอมจากการแทงหวยของ ${user.phone}`,
    //         dateNow,
    //         user.refs_code,
    //         billCode,
    //       ]
    //     );
    //   }
    // }

    await conn.commit();

    return res
      .status(200)
      .json({ status: true, msg: "แทงหวยสำเร็จ", bill_code: billCode });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    return res.status(500).json({ status: false, msg: "เกิดข้อผิดพลาด" });
  } finally {
    if (conn) conn.release();
  }
});

router.post("/cancel-lotto", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const billCode = req.body.billCode;
      const lotto_type_id = req.body.lotto_type_id;
      if (billCode != "" && lotto_type_id != "") {
        connection.query(
          `SELECT * FROM poy WHERE poy_code = ? AND created_by = ? AND status = ? AND status_result = 0`,
          [billCode, data.user.id, "SUC"],
          (error, resultCheckPoy, fields) => {
            if (resultCheckPoy != "") {
              connection.query(
                `SELECT lotto_type_name, closing_time FROM lotto_type WHERE lotto_type_id = ? AND open = 1`,
                [lotto_type_id],
                (error, resultType, fields) => {
                  if (resultType != "") {
                    var now = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                    var d = moment(new Date(resultType[0].closing_time)).format(
                      "YYYY-MM-DD HH:mm:ss"
                    );
                    connection.query(
                      `SELECT SUBTIME("${d}", "0:15:0") as cancel_time`,
                      (error, resultTime, fields) => {
                        if (now < resultTime[0].cancel_time) {
                          connection.query(
                            `UPDATE poy SET status = 'CAN' WHERE poy_code = ? AND created_by = ?`,
                            [billCode, data.user.id],
                            (error, result, fields) => {
                              connection.query(
                                `UPDATE lotto_number SET status_poy = 'CAN' WHERE poy_code = ? AND created_by = ?`,
                                [billCode, data.user.id],
                                (error, result, fields) => {
                                  connection.query(
                                    `SELECT p.total, mb.credit_balance FROM poy as p JOIN member as mb ON p.created_by = mb.id WHERE p.poy_code = ? AND p.created_by = ? AND p.status = ?`,
                                    [billCode, data.user.id, "CAN"],
                                    (error, resultTotal, fields) => {
                                      if (resultTotal != "") {
                                        let balance =
                                          resultTotal[0].credit_balance +
                                          resultTotal[0].total;
                                        connection.query(
                                          `UPDATE member SET credit_balance = ? WHERE id = ?`,
                                          [balance, data.user.id],
                                          (error, resultUpdate, fields) => {
                                            return res.status(200).send({
                                              status: true,
                                              msg: "ยกเลิกโพยสำเร็จ",
                                            });
                                          }
                                        );
                                      } else {
                                        return res.status(400).send({
                                          status: false,
                                          msg: "โพยนี้ถูกยกเลิกแล้ว",
                                        });
                                      }
                                    }
                                  );
                                }
                              );
                            }
                          );
                        } else {
                          return res.status(400).send({
                            status: false,
                            msg: "เกินเวลายกเลิกโพยกรุณายกเลิกก่อน 15 นาที",
                          });
                        }
                      }
                    );
                  } else {
                    return res.status(400).send({
                      status: false,
                      msg: "หวยนี้ปิดแล้ว ไม่สามารถยกเลิกโพยได้",
                    });
                  }
                  // if (resultType != "") {
                  //   connection.query(
                  //     `SELECT * FROM poy WHERE poy_code = ? AND lotto_type_id = ?`,
                  //     [billCode, lotto_type_id],
                  //     (error, resultPoy, fields) => {
                  //
                  //     }
                  //   );
                  // } else {
                  //   return res
                  //     .status(400)
                  //     .send({ status: false, msg: "กรุณากรอกเลขหวย" });
                  // }

                  // if (resultPoy) {
                  //   return res
                  //     .status(400)
                  //     .send({ status: false, msg: "กรุณากรอกเลขหวย" });
                  // } else {
                  //   return res
                  //     .status(400)
                  //     .send({ status: false, msg: "กรุณากรอกเลขหวย" });
                  // }
                }
              );
            } else {
              return res.status(400).send({
                status: false,
                msg: "เกิดข้อผิดพลาด ไม่สามารถลบโพยนี้ได้",
              });
            }
          }
        );
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่งข้อมูลให้ครบ" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.post("/cancel-lotto/admin", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const billCode = req.body.billCode;
      const lotto_type_id = req.body.lotto_type_id;
      if (billCode != "" && lotto_type_id != "") {
        connection.query(
          `SELECT * FROM poy WHERE poy_code = ? AND status = ? AND status_result = 0`,
          [billCode, "SUC"],
          (error, resultCheckPoy, fields) => {
            if (resultCheckPoy != "") {
              // connection.query(
              //   `SELECT lotto_type_name, closing_time FROM lotto_type WHERE lotto_type_id = ? AND open = 1`,
              //   [lotto_type_id],
              //   (error, resultType, fields) => {
              //     if (resultType != "") {
              var now = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
              // var d = moment(new Date(resultType[0].closing_time)).format(
              //   "YYYY-MM-DD HH:mm:ss"
              // );
              connection.query(
                `UPDATE poy SET status = 'CAN' WHERE poy_code = ? AND created_by = ?`,
                [billCode, resultCheckPoy[0].created_by],
                (error, result, fields) => {
                  connection.query(
                    `UPDATE lotto_number SET status_poy = 'CAN' WHERE poy_code = ? AND created_by = ?`,
                    [billCode, resultCheckPoy[0].created_by],
                    (error, result, fields) => {
                      connection.query(
                        `SELECT p.total, mb.credit_balance FROM poy as p JOIN member as mb ON p.created_by = mb.id WHERE p.poy_code = ? AND p.created_by = ? AND p.status = ?`,
                        [billCode, resultCheckPoy[0].created_by, "CAN"],
                        (error, resultTotal, fields) => {
                          if (resultTotal != "") {
                            let balance =
                              resultTotal[0].credit_balance +
                              resultTotal[0].total;
                            connection.query(
                              `UPDATE member SET credit_balance = ? WHERE id = ?`,
                              [balance, resultCheckPoy[0].created_by],
                              (error, resultUpdate, fields) => {
                                return res.status(200).send({
                                  status: true,
                                  msg: "ยกเลิกโพยสำเร็จ",
                                });
                              }
                            );
                          } else {
                            return res.status(400).send({
                              status: false,
                              msg: "โพยนี้ถูกยกเลิกแล้ว",
                            });
                          }
                        }
                      );
                    }
                  );
                }
              );
              // } else {
              //   return res.status(400).send({
              //     status: false,
              //     msg: "หวยนี้ปิดแล้ว ไม่สามารถยกเลิกโพยได้",
              //   });
              // }
              //   }
              // );
            } else {
              return res.status(400).send({
                status: false,
                msg: "เกิดข้อผิดพลาด ไม่สามารถลบโพยนี้ได้",
              });
            }
          }
        );
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่งข้อมูลให้ครบ" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});
module.exports = router;
