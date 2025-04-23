const config = require("./config/config");
const { JOB_SCHEDULE } = config;
const cron = require("node-cron");
const connection = require("./config/connection");
const moment = require("moment");
const axios = require("axios");
const { updatePlayLimitMembers } = require("./routes/sql/lottoNumber");

cron.schedule(JOB_SCHEDULE, async () => {
  var sql =
    "UPDATE lotto_type SET open = 1, closing_time = CONCAT(CURDATE(), ' ', TIME(closing_time)) WHERE type_id != 2";
  connection.query(sql, (error, result, fields) => {
    console.log("Update lotto closing time after 02.00");
  });

  var params = [50];
  const resetMaxLimitUsers = await updatePlayLimitMembers(params);

  // var dateTh = moment(new Date()).locale("th").format("dddd");
  // var sqlQueryCloseDate =
  //   "SELECT * FROM close_lotto WHERE c_day = ? AND active = 1";
  // connection.query(sqlQueryCloseDate, [dateTh], (error, result, fields) => {
  //
  //   console.log(result);
  //   if (result != "") {
  //     result.forEach((item) => {
  //       var sqlCloseDate =
  //         "UPDATE lotto_type SET open = 0 WHERE lotto_type_id = ?";
  //       connection.query(
  //         sqlCloseDate,
  //         [item.lotto_type_id],
  //         (error, result, fields) => {
  //
  //           console.log("Update lotto closing");
  //         }
  //       );
  //     });
  //   }
  // });
});

cron.schedule("55 23 * * *", () => {
  // const today = moment().format("YYYY-MM-DD");
  var sql = `SELECT SUM(p.total) as total, SUM(p.total) as total_aff, mb.phone, mb.refs_code, mb.id, mb.aff_percentage FROM poy as p LEFT JOIN member as mb ON p.created_by = mb.id WHERE p.status = 'SUC' AND p.status_result = 1 AND mb.refs_code IS NOT NULL AND p.installment_date = DATE_FORMAT(NOW(), '%Y-%m-%d') GROUP BY p.created_by`;
  connection.query(sql, (error, result, fields) => {
    if (result != undefined || result != [] || result.length > 0) {
      result.forEach((item) => {
        var sql = "SELECT * FROM member WHERE phone = ?";
        connection.query(
          sql,
          [item.refs_code],
          (error, resultMember, fields) => {
            if (resultMember.length > 0) {
              var sql =
                "INSERT INTO aff_log_daily (m_id_header, m_id_user, total, total_aff) VALUES (?, ?, ?, ?)";
              connection.query(
                sql,
                [
                  resultMember[0].id,
                  item.id,
                  item.total,
                  (item.total_aff * resultMember[0].aff_percentage) / 100,
                ],
                (error, resultInsert, fields) => {
                  var sql =
                    "UPDATE member SET credit_aff = (credit_aff + ?) WHERE id = ?";
                  connection.query(
                    sql,
                    [
                      (item.total_aff * resultMember[0].aff_percentage) / 100,
                      resultMember[0].id,
                    ],
                    (error, resultUpdate, fields) => {
                      console.log(
                        "Add Credit Affiliate ",
                        resultMember[0].id,
                        item.id,
                        item.total,
                        (item.total_aff * resultMember[0].aff_percentage) / 100
                      );
                    }
                  );
                }
              );
            }
          }
        );
      });
    }
    console.log("Update lotto closing time after 23.55");
  });
});

cron.schedule("*/1 * * * *", () => {
  var dateTh = moment(new Date()).locale("th").format("dddd");
  var sqlQueryCloseDate =
    "SELECT * FROM close_lotto WHERE c_day = ? AND active = 1";
  connection.query(sqlQueryCloseDate, [dateTh], (error, result, fields) => {
    if (result != "") {
      result.forEach((item) => {
        var sqlCloseDate =
          "UPDATE lotto_type SET open = 0 WHERE lotto_type_id = ?";
        connection.query(
          sqlCloseDate,
          [item.lotto_type_id],
          (error, result, fields) => {
            console.log("Update lotto closing");
          }
        );
      });
    }
  });
  // console.log("Run task every minute");
  var sql =
    "SELECT lotto_type_id, lotto_type_name, closing_time FROM lotto_type";
  connection.query(sql, (error, result, fields) => {
    result.forEach((item) => {
      countDown(item.closing_time, item.lotto_type_id);
    });
    console.log("Update lotto time every 1 minute");
  });
  // getdata();
  getPrize();
  function countDown(date, id) {
    if (date != null && id != null) {
      var dd = moment(new Date(date)).format("YYYY-MM-DD HH:mm:ss");
      // var d = new Date(date);
      // var countDownDate = new Date(
      //   d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000)
      // );
      var countDownDate = new Date(dd).getTime();
      var now = new Date().getTime();
      var distance = countDownDate - now;
      // var hours = Math.floor(
      //   (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      // );
      // var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      // var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      if (distance < 0) {
        var sql = "UPDATE lotto_type SET open = 0 WHERE lotto_type_id = ?";
        connection.query(sql, [id], (error, result, fields) => {});
      }
    }
  }
});

function func3back(number) {
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
    //วนลูปการแทรกตัวเลข ทั้ง 2 ตัวเลขจาก level 1
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

function func4back(number) {
  var textnum = number.toString(); // แปลงตัวเลขเป็น string
  var result = new Set();

  // ฟังก์ชันหาค่าจัดเรียง (Permutation)
  function permute(arr, temp = "") {
    if (arr.length === 0) {
      result.add(temp); // เพิ่มค่าเข้า Set เพื่อป้องกันค่าซ้ำ
    } else {
      for (let i = 0; i < arr.length; i++) {
        let newArr = arr.slice(0, i).concat(arr.slice(i + 1));
        permute(newArr, temp + arr[i]);
      }
    }
  }

  // เรียกใช้ฟังก์ชันเพื่อหาค่าจัดเรียงทั้งหมด
  permute(textnum.split(""));

  return [...result]; // แปลง Set กลับเป็น Array
}

// cron.schedule("*/1 * * * *", () => {
//   // console.log("Run task every minute");
//   var sql =
//     "SELECT lotto_type_id, lotto_type_name, closing_time FROM lotto_type";
//   connection.query(sql, (error, result, fields) => {
//
//     result.forEach((item) => {
//       countDown(item.closing_time, item.lotto_type_id);
//     });
//     console.log("Update lotto time every 1 minute");
//   });
//   function countDown(date, id) {
//     if (date != null && id != null) {
//       var dd = moment(new Date(date)).format("YYYY-MM-DD HH:mm:ss");
//       // var d = new Date(date);
//       // var countDownDate = new Date(
//       //   d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000)
//       // );
//       var countDownDate = new Date(dd).getTime();
//       var now = new Date().getTime();
//       var distance = countDownDate - now;
//       // var hours = Math.floor(
//       //   (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
//       // );
//       // var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
//       // var seconds = Math.floor((distance % (1000 * 60)) / 1000);
//       if (distance < 0) {
//         var sql = "UPDATE lotto_type SET open = 0 WHERE lotto_type_id = ?";
//         connection.query(sql, [id], (error, result, fields) => {
//
//         });
//       }
//     }
//   }
// });

/////////////////// api data lotto ออกผลหวยออโต้ /////////////////////////////

// async function getPrize() {
//   var dateNow = moment(new Date()).format("YYYY-MM-DD");
//   await axios
//     .get("https://ruaymanage.com/api/v1/prize", {
//       params: {
//         date: dateNow,
//       },
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//         "Accept-Encoding": "*",
//       },
//     })
//     .then((response) => {
//       // console.log(response.data.result);
//       if (response.data.status) {
//         var sql = "SELECT * FROM lotto_type WHERE open = 0 AND active = 1";
//         connection.query(sql, (error, result, fields) => {
//           if (result != undefined) {
//             result.forEach((rs) => {
//               var date = moment(new Date(rs.closing_time)).format("YYYY-MM-DD");
//               response.data.result.forEach((el) => {
//                 if (
//                   rs.lotto_type_name
//                     .toLowerCase()
//                     .replace(/[\s()]/g, "")
//                     .replace("รอบ", "") ===
//                   el.lotto_name
//                     .toLowerCase()
//                     .replace(/[\s()]/g, "")
//                     .replace("รอบ", "")
//                 ) {
//                   var sql =
//                     "SELECT * FROM prize WHERE lotto_type_id = ? AND prize_time = ?";
//                   connection.query(
//                     sql,
//                     [rs.lotto_type_id, dateNow],
//                     (error, resultPrize, fields) => {
//                       if (resultPrize == "") {
//                         if (
//                           el.top3 !== "---" &&
//                           el.down2 !== "--" &&
//                           el.top3 != null &&
//                           el.down2 != null &&
//                           el.top3 != "" &&
//                           el.down2 != ""
//                         ) {
//                           var award3top = el.top3;
//                           var type3top = "3 ตัวบน";
//                           var type2bottom = "2 ตัวล่าง";
//                           // if (el.award1.length > 3) {
//                           //   award3top = el.award1.substr(3, 6);
//                           // }
//                           var sql =
//                             "INSERT INTO prize (lotto_type_id, type3top, prize3top, type2bottom, prize2bottom, prize_time) VALUES(?, ?, ?, ?, ?, ?)";
//                           connection.query(
//                             sql,
//                             [
//                               rs.lotto_type_id,
//                               type3top,
//                               award3top,
//                               type2bottom,
//                               el.down2,
//                               dateNow,
//                             ],
//                             (error, result, fields) => {
//                               console.log("เพิ่มผลหวยสำเร็จ");
//                             }
//                           );
//                         }
//                       } else {
//                         if (resultPrize[0].status == 0) {
//                           var sql =
//                             "SELECT ln.*, mb.credit_balance FROM lotto_number as ln JOIN lotto_type as lt ON ln.lotto_type_id = lt.lotto_type_id JOIN member as mb ON ln.created_by = mb.id WHERE ln.lotto_type_id = ? AND ln.status_poy = 'SUC' AND ln.installment_date = ?";
//                           connection.query(
//                             sql,
//                             [rs.lotto_type_id, dateNow],
//                             (error, resultLotto, fields) => {
//                               var sqlUpdate = `UPDATE lotto_number SET status = 'suc' WHERE lotto_number_id = ? AND status_poy = 'SUC' AND status = 'wait'`;
//                               resultLotto.forEach((item) => {
//                                 if (
//                                   item.type_option === "วิ่งบน" &&
//                                   dateChange(item.installment_date) === el.date
//                                 ) {
//                                   const number = resultPrize.find((n) =>
//                                     n.prize3top.toString().includes(item.number)
//                                   );
//                                   if (number != undefined) {
//                                     connection.query(
//                                       sqlUpdate,
//                                       [item.lotto_number_id],
//                                       (error, result, fields) => {}
//                                     );

//                                     // connection.query(
//                                     //   `UPDATE prize SET status = 1 WHERE prize_id = ?`,
//                                     //   [resultPrize[0].prize_id],
//                                     //   (error, result, fields) => {
//                                     //
//                                     var sql =
//                                       "INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES(?, ?, ?, ?, ?)";
//                                     let total = 0;
//                                     total = item.price * item.pay;
//                                     connection.query(
//                                       sql,
//                                       [
//                                         item.lotto_type_id,
//                                         dateNow,
//                                         item.created_by,
//                                         total,
//                                         item.poy_code,
//                                       ],
//                                       (error, result, fields) => {}
//                                     );
//                                     //   }
//                                     // );
//                                   } else {
//                                     connection.query(
//                                       `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
//                                       [
//                                         item.lotto_type_id,
//                                         item.lotto_number_id,
//                                         "wait",
//                                       ],
//                                       (error, result, fields) => {}
//                                     );
//                                   }
//                                 } else if (
//                                   item.type_option === "วิ่งล่าง" &&
//                                   dateChange(item.installment_date) === el.date
//                                 ) {
//                                   const number = resultPrize.find((n) =>
//                                     n.prize2bottom
//                                       .toString()
//                                       .includes(item.number)
//                                   );
//                                   if (number != undefined) {
//                                     connection.query(
//                                       sqlUpdate,
//                                       [item.lotto_number_id],
//                                       (error, result, fields) => {}
//                                     );

//                                     // connection.query(
//                                     //   `UPDATE prize SET status = 1 WHERE prize_id = ?`,
//                                     //   [resultPrize[0].prize_id],
//                                     //   (error, result, fields) => {
//                                     //
//                                     var sql =
//                                       "INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES(?, ?, ?, ?, ?)";
//                                     let total = 0;
//                                     total = item.price * item.pay;
//                                     connection.query(
//                                       sql,
//                                       [
//                                         item.lotto_type_id,
//                                         dateNow,
//                                         item.created_by,
//                                         total,
//                                         item.poy_code,
//                                       ],
//                                       (error, result, fields) => {}
//                                     );
//                                     //   }
//                                     // );
//                                   } else {
//                                     connection.query(
//                                       `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
//                                       [
//                                         item.lotto_type_id,
//                                         item.lotto_number_id,
//                                         "wait",
//                                       ],
//                                       (error, result, fields) => {}
//                                     );
//                                   }
//                                 } else if (
//                                   item.type_option === "2 ตัวบน" &&
//                                   dateChange(item.installment_date) === el.date
//                                 ) {
//                                   const number = resultPrize.find((n) =>
//                                     n.prize3top
//                                       .toString()
//                                       .substr(1)
//                                       .includes(item.number)
//                                   );
//                                   if (number != undefined) {
//                                     connection.query(
//                                       sqlUpdate,
//                                       [item.lotto_number_id],
//                                       (error, result, fields) => {}
//                                     );

//                                     // connection.query(
//                                     //   `UPDATE prize SET status = 1 WHERE prize_id = ?`,
//                                     //   [resultPrize[0].prize_id],
//                                     //   (error, result, fields) => {
//                                     //
//                                     var sql =
//                                       "INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES(?, ?, ?, ?, ?)";
//                                     let total = 0;
//                                     total = item.price * item.pay;
//                                     connection.query(
//                                       sql,
//                                       [
//                                         item.lotto_type_id,
//                                         dateNow,
//                                         item.created_by,
//                                         total,
//                                         item.poy_code,
//                                       ],
//                                       (error, result, fields) => {}
//                                     );
//                                     //   }
//                                     // );
//                                   } else {
//                                     connection.query(
//                                       `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
//                                       [
//                                         item.lotto_type_id,
//                                         item.lotto_number_id,
//                                         "wait",
//                                       ],
//                                       (error, result, fields) => {}
//                                     );
//                                   }
//                                 } else if (
//                                   item.type_option === "3 ตัวโต๊ด" &&
//                                   dateChange(item.installment_date) === el.date
//                                 ) {
//                                   const result = func3back(
//                                     resultPrize[0].prize3top
//                                   );
//                                   if (result.indexOf(item.number) != -1) {
//                                     // console.log(item.number, "ถูก 3 ตัวโต๊ด");
//                                     connection.query(
//                                       sqlUpdate,
//                                       [item.lotto_number_id],
//                                       (error, result, fields) => {}
//                                     );

//                                     // connection.query(
//                                     //   `UPDATE prize SET status = 1 WHERE prize_id = ?`,
//                                     //   [resultPrize[0].prize_id],
//                                     //   (error, result, fields) => {
//                                     //
//                                     var sql =
//                                       "INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES(?, ?, ?, ?, ?)";
//                                     let total = 0;
//                                     total = item.price * item.pay;
//                                     connection.query(
//                                       sql,
//                                       [
//                                         item.lotto_type_id,
//                                         dateNow,
//                                         item.created_by,
//                                         total,
//                                         item.poy_code,
//                                       ],
//                                       (error, result, fields) => {}
//                                     );
//                                     //   }
//                                     // );
//                                   } else {
//                                     connection.query(
//                                       `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
//                                       [
//                                         item.lotto_type_id,
//                                         item.lotto_number_id,
//                                         "wait",
//                                       ],
//                                       (error, result, fields) => {}
//                                     );
//                                     // console.log(item.number, "ไม่ถูก 3 ตัว");
//                                   }
//                                 } else if (
//                                   item.type_option === "3 ตัวบน" &&
//                                   dateChange(item.installment_date) === el.date
//                                 ) {
//                                   if (
//                                     parseInt(item.number) ===
//                                     parseInt(resultPrize[0].prize3top)
//                                   ) {
//                                     connection.query(
//                                       sqlUpdate,
//                                       [item.lotto_number_id],
//                                       (error, result, fields) => {}
//                                     );

//                                     var sql =
//                                       "INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES(?, ?, ?, ?, ?)";
//                                     let total = 0;
//                                     total = item.price * item.pay;
//                                     connection.query(
//                                       sql,
//                                       [
//                                         item.lotto_type_id,
//                                         dateNow,
//                                         item.created_by,
//                                         total,
//                                         item.poy_code,
//                                       ],
//                                       (error, result, fields) => {}
//                                     );
//                                     //   }
//                                     // );
//                                   } else {
//                                     connection.query(
//                                       `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
//                                       [
//                                         item.lotto_type_id,
//                                         item.lotto_number_id,
//                                         "wait",
//                                       ],
//                                       (error, result, fields) => {}
//                                     );
//                                   }
//                                 } else if (
//                                   item.type_option === "2 ตัวล่าง" &&
//                                   dateChange(item.installment_date) === el.date
//                                 ) {
//                                   if (
//                                     item.number === resultPrize[0].prize2bottom
//                                   ) {
//                                     connection.query(
//                                       sqlUpdate,
//                                       [item.lotto_number_id],
//                                       (error, result, fields) => {}
//                                     );

//                                     var sql =
//                                       "INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES(?, ?, ?, ?, ?)";
//                                     let total = 0;
//                                     total = item.price * item.pay;
//                                     connection.query(
//                                       sql,
//                                       [
//                                         item.lotto_type_id,
//                                         dateNow,
//                                         item.created_by,
//                                         total,
//                                         item.poy_code,
//                                       ],
//                                       (error, result, fields) => {}
//                                     );
//                                     //   }
//                                     // );
//                                   } else {
//                                     connection.query(
//                                       `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
//                                       [
//                                         item.lotto_type_id,
//                                         item.lotto_number_id,
//                                         "wait",
//                                       ],
//                                       (error, result, fields) => {}
//                                     );
//                                   }
//                                   // console.log("ถูก 2 ตัว");
//                                 } else {
//                                   connection.query(
//                                     `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND status = ? AND installment_date = DATE_FORMAT(NOW(), '%Y-%m-%d')`,
//                                     [item.lotto_type_id, "wait"],
//                                     (error, result, fields) => {}
//                                   );
//                                 }
//                               });
//                               connection.query(
//                                 `UPDATE poy SET status_result = ? WHERE lotto_type_id = ? AND created_at`,
//                                 [1, rs.lotto_type_id, dateNow],
//                                 (error, result, fields) => {}
//                               );
//                               connection.query(
//                                 `UPDATE prize SET status = 1 WHERE prize_id = ?`,
//                                 [resultPrize[0].prize_id],
//                                 (error, result, fields) => {
//                                   // return res.status(200).send({
//                                   //   status: true,
//                                   //   msg: "อัพเดทออกผลหวยสำเร็จ",
//                                   // });
//                                   var sql = `SELECT SUM(total * pay) as total, created_by FROM lotto_number WHERE installment_date = ? AND lotto_type_id = ? AND status = 'suc' GROUP BY created_by`;
//                                   connection.query(
//                                     sql,
//                                     [dateNow, rs.lotto_type_id],
//                                     (error, resultPrizeLog, fields) => {
//                                       let totalCredit = 0;
//                                       resultPrizeLog.forEach((item) => {
//                                         connection.query(
//                                           `SELECT credit_balance FROM member WHERE id = ?`,
//                                           [item.created_by],
//                                           (error, resultCredit, fields) => {
//                                             if (resultCredit != "") {
//                                               totalCredit =
//                                                 parseFloat(
//                                                   resultCredit[0].credit_balance
//                                                 ) + parseFloat(item.total);
//                                               connection.query(
//                                                 `UPDATE member SET credit_balance = ? WHERE id = ?`,
//                                                 [totalCredit, item.created_by],
//                                                 (error, result, fields) => {
//                                                   console.log(
//                                                     `อัพเดทกระเป๋าสำเร็จ`
//                                                   );
//                                                 }
//                                               );
//                                               connection.query(
//                                                 `INSERT INTO credit_log (credit_previous,credit_after,created_by,lotto_type_id,installment,prize) VALUES (?,?,?,?,?,?)`,
//                                                 [
//                                                   resultCredit[0]
//                                                     .credit_balance,
//                                                   totalCredit,
//                                                   item.created_by,
//                                                   rs.lotto_type_id,
//                                                   dateNow,
//                                                   item.total,
//                                                 ],
//                                                 (error, result, fields) => {}
//                                               );
//                                             }
//                                           }
//                                         );
//                                       });
//                                     }
//                                   );
//                                   // lottoNotify(
//                                   //   rs.lotto_type_name,
//                                   //   resultPrize[0]
//                                   // );
//                                   console.log(
//                                     `อัพเดทออกผลหวย ${rs.lotto_type_name} สำเร็จ`
//                                   );
//                                 }
//                               );
//                             }
//                           );
//                         }
//                       }
//                     }
//                   );
//                 }
//               });
//             });
//           }
//         });
//       }
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// }

const rules = {
  วิ่งบน: (item, prize) => prize.prize3top.toString().includes(item.number),
  วิ่งล่าง: (item, prize) =>
    prize.prize2bottom.toString().includes(item.number),
  "2 ตัวบน": (item, prize) =>
    prize.prize3top.toString().substr(1) === item.number,
  "3 ตัวโต๊ด": (item, prize) =>
    func3back(prize.prize3top).includes(item.number),
  "3 ตัวบน": (item, prize) =>
    parseInt(item.number) === parseInt(prize.prize3top),
  "3 ตัวล่าง": (item, prize) => {
    const prize3front =
      prize.prize3bottom.find((p) => p.prize3front)?.prize3front || [];
    const prize3after =
      prize.prize3bottom.find((p) => p.prize3after)?.prize3after || [];
    return (
      item.number === prize3front[0] ||
      item.number === prize3front[1] ||
      item.number === prize3after[0] ||
      item.number === prize3after[1]
    );
  },
  "2 ตัวล่าง": (item, prize) => item.number === prize.prize2bottom,
  "4 ตัวโต๊ด": (item, prize) =>
    func4back(prize.prize6digit.slice(2)).includes(item.number),
  "4 ตัวบน": (item, prize) =>
    parseInt(item.number) === parseInt(prize.prize6digit.slice(2)),
};

async function getPrize() {
  var dateNow = moment(new Date()).format("YYYYMMDD");
  var dateNow2 = moment(new Date()).format("YYYY-MM-DD");
  var dateNow3 = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
  await axios
    .get(`https://api.huaykk.live/info/getResult/${dateNow}`, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "*",
      },
    })
    .then((response) => {
      if (response.data.success) {
        // console.log(response.data.info);
        var sql =
          "SELECT * FROM lotto_type WHERE open = 0 AND active = 1 AND DATE(closing_time) = CURDATE()";
        connection.query(sql, (error, result, fields) => {
          if (result != undefined) {
            response.data.info.forEach((el) => {
              // console.log(el, "el");
              const queryLottoClose = result.find((item) => {
                let date = moment(item.closing_time, "YYYY-MM-DD HH:mm:ss");
                let formattedDate =
                  date.format("DD/MM") +
                  "/" +
                  (date.year() + 543).toString().slice(-2);
                let dateRegex = el.periodName.match(/\d{2}\/\d{2}\/\d{2}/)[0];
                return (
                  item.url === el.productCode && formattedDate === dateRegex
                );
              });
              if (queryLottoClose != undefined) {
                var sql =
                  "SELECT * FROM prize WHERE lotto_type_id = ? AND prize_time = ?";
                connection.query(
                  sql,
                  [queryLottoClose.lotto_type_id, dateNow2],
                  (error, resultPrize, fields) => {
                    if (resultPrize.length < 1) {
                      // console.log(dateRegex, "dateRegex", "===", formattedDate);
                      var award3bottom = [];
                      var award3top = null;

                      if (el.award3 && el.award4) {
                        award3bottom.push(
                          {
                            type3front: "3 ตัวหน้า",
                            prize3front: [el.award3],
                          },
                          {
                            type3after: "3 ตัวหลัง",
                            prize3after: [el.award4],
                          }
                        );
                      }
                      if (
                        el.award1 != "xxxxxx" &&
                        el.award1 != "xxx" &&
                        el.award2 != "xx"
                      ) {
                        // console.log(queryLottoClose, "queryLottoClose");
                        var sql =
                          "INSERT INTO prize (lotto_type_id, prize6digit, prize3bottom, type3top, prize3top, type2bottom, prize2bottom, prize_time) VALUES(?, ?, ?, ?, ?, ?, ?, ?)";
                        connection.query(
                          sql,
                          [
                            queryLottoClose.lotto_type_id,
                            el.award1.length === 6 && el.award1 != "xxxxxx"
                              ? el.award1
                              : null,
                            award3bottom.length > 0
                              ? JSON.stringify(award3bottom)
                              : null,
                            "3 ตัวบน",
                            el.award1.length === 3 && el.award1 != "xxx"
                              ? el.award1
                              : el.award1.slice(3),
                            "2 ตัวล่าง",
                            el.award2,
                            queryLottoClose.closing_time,
                          ],
                          (error, result, fields) => {
                            if (error) console.log(error);
                            if (result) {
                              console.log(
                                `เพิ่มผลหวย ${queryLottoClose.lotto_type_name} สำเร็จ ${dateNow3}`
                              );
                            }
                          }
                        );
                      }
                    } else {
                      // const updateSuccess = (item) => {
                      //   return new Promise((resolve, reject) => {
                      //     const sqlUpdate = `UPDATE lotto_number SET status = 'suc' WHERE lotto_number_id = ? AND status_poy = 'SUC' AND status = 'wait'`;
                      //     connection.query(
                      //       sqlUpdate,
                      //       [item.lotto_number_id],
                      //       (error) => {
                      //         if (error) return reject(error);
                      //         resolve();
                      //       }
                      //     );
                      //   });
                      // };

                      // const insertPrizeLog = (item, total) => {
                      //   return new Promise((resolve, reject) => {
                      //     const sql = `INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES (?, NOW(), ?, ?, ?)`;
                      //     connection.query(
                      //       sql,
                      //       [
                      //         item.lotto_type_id,
                      //         item.created_by,
                      //         total,
                      //         item.poy_code,
                      //       ],
                      //       (error) => {
                      //         if (error) return reject(error);
                      //         resolve();
                      //       }
                      //     );
                      //   });
                      // };

                      // const updateFail = (item) => {
                      //   return new Promise((resolve, reject) => {
                      //     connection.query(
                      //       `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
                      //       [item.lotto_type_id, item.lotto_number_id, "wait"],
                      //       (error) => {
                      //         if (error) return reject(error);
                      //         resolve();
                      //       }
                      //     );
                      //   });
                      // };

                      // const updateStatusPoy = (item) => {
                      //   return new Promise((resolve, reject) => {
                      //     connection.query(
                      //       `UPDATE poy SET status_result = ? WHERE lotto_type_id = ? AND installment_date = CURDATE();`,
                      //       [1, item.lotto_type_id],
                      //       (error) => {
                      //         if (error) return reject(error);
                      //         resolve();
                      //       }
                      //     );
                      //   });
                      // };

                      // const updateStatusPrize = (prize) => {
                      //   return new Promise((resolve, reject) => {
                      //     const sql = `UPDATE prize SET status = 1 WHERE prize_id = ?`;
                      //     connection.query(sql, [prize.prize_id], (error) => {
                      //       if (error) return reject(error);
                      //       resolve();
                      //     });
                      //   });
                      // };

                      // const processLotto = async () => {
                      //   try {
                      //     const [resultPrize] = await connection
                      //       .promise()
                      //       .query(
                      //         "SELECT * FROM prize WHERE lotto_type_id = ? AND prize_time = ? AND status = 0",
                      //         [queryLottoClose.lotto_type_id, dateNow2]
                      //       );

                      //     if (resultPrize.length === 0) return;

                      //     const [resultLotto] = await connection
                      //       .promise()
                      //       .query(
                      //         `SELECT ln.* FROM lotto_number as ln
                      //       LEFT JOIN lotto_type as lt ON ln.lotto_type_id = lt.lotto_type_id
                      //       LEFT JOIN member as mb ON ln.created_by = mb.id
                      //       WHERE ln.lotto_type_id = ? AND ln.status_poy = 'SUC' AND ln.installment_date = DATE(lt.closing_time);`,
                      //         [queryLottoClose.lotto_type_id]
                      //       );

                      //     await updateStatusPrize(resultPrize[0]);

                      //     for (const item of resultLotto) {
                      //       const date = moment(
                      //         item.installment_date,
                      //         "YYYY-MM-DD"
                      //       );
                      //       const formattedDate =
                      //         date.format("DD/MM") +
                      //         "/" +
                      //         (date.year() + 543).toString().slice(-2);
                      //       const dateRegex =
                      //         el.periodName.match(/\d{2}\/\d{2}\/\d{2}/)[0];
                      //       if (formattedDate !== dateRegex) continue;

                      //       const checkRule = rules[item.type_option];
                      //       if (!checkRule) continue;

                      //       const isWin = resultPrize.some((prize) =>
                      //         checkRule(item, prize)
                      //       );

                      //       if (isWin) {
                      //         await updateSuccess(item);
                      //         const total = item.price * item.pay;
                      //         await insertPrizeLog(item, total);
                      //         await updateStatusPoy(item);

                      //         const [resultPrizeLog] = await connection
                      //           .promise()
                      //           .query(
                      //             // `SELECT SUM(total * pay) as total, created_by FROM lotto_number WHERE installment_date = CURDATE() AND lotto_type_id = ? AND status = 'suc' GROUP BY created_by`,
                      //             `SELECT lotto_type_id, lotto_date, created_by, total, poy_code FROM prize_log WHERE lotto_date = CURDATE() AND lotto_type_id = ?`,
                      //             [queryLottoClose.lotto_type_id]
                      //           );

                      //         for (const prizeItem of resultPrizeLog) {
                      //           const [resultCredit] = await connection
                      //             .promise()
                      //             .query(
                      //               `SELECT credit_balance FROM member WHERE id = ?`,
                      //               [prizeItem.created_by]
                      //             );

                      //           if (resultCredit.length > 0) {
                      //             const totalCredit =
                      //               parseFloat(resultCredit[0].credit_balance) +
                      //               parseFloat(prizeItem.total);
                      //             await connection
                      //               .promise()
                      //               .query(
                      //                 `UPDATE member SET credit_balance = ? WHERE id = ?`,
                      //                 [totalCredit, prizeItem.created_by]
                      //               );

                      //             await connection
                      //               .promise()
                      //               .query(
                      //                 `INSERT INTO credit_log (credit_previous, credit_after, created_by, lotto_type_id, installment, prize) VALUES (?, ?, ?, ?, ?, ?)`,
                      //                 [
                      //                   resultCredit[0].credit_balance,
                      //                   totalCredit,
                      //                   prizeItem.created_by,
                      //                   queryLottoClose.lotto_type_id,
                      //                   dateNow,
                      //                   prizeItem.total,
                      //                 ]
                      //               );

                      //             console.log(`เพิ่มเครดิตถูกหวยสำเร็จ`);
                      //           }
                      //         }
                      //       } else {
                      //         await updateFail(item);
                      //       }
                      //     }

                      //     // console.log("ประมวลผลเรียบร้อย");
                      //   } catch (error) {
                      //     console.error("เกิดข้อผิดพลาด:", error);
                      //   }
                      // };

                      // processLotto();
                      const processLotto = async () => {
                        const conn = connection.promise();
                        const trx = await conn.getConnection();

                        try {
                          await trx.beginTransaction();

                          const [resultPrize] = await trx.query(
                            "SELECT * FROM prize WHERE lotto_type_id = ? AND prize_time = ? AND status = 0",
                            [queryLottoClose.lotto_type_id, dateNow2]
                          );

                          if (resultPrize.length === 0) return;

                          const [resultLotto] = await trx.query(
                            `SELECT ln.* FROM lotto_number as ln 
                             LEFT JOIN lotto_type as lt ON ln.lotto_type_id = lt.lotto_type_id 
                             LEFT JOIN member as mb ON ln.created_by = mb.id 
                             WHERE ln.lotto_type_id = ? AND ln.status_poy = 'SUC' AND ln.installment_date = DATE(lt.closing_time);`,
                            [queryLottoClose.lotto_type_id]
                          );

                          await trx.query(
                            `UPDATE prize SET status = 1 WHERE prize_id = ?`,
                            [resultPrize[0].prize_id]
                          );

                          for (const item of resultLotto) {
                            const date = moment(
                              item.installment_date,
                              "YYYY-MM-DD"
                            );
                            const formattedDate =
                              date.format("DD/MM") +
                              "/" +
                              (date.year() + 543).toString().slice(-2);
                            const dateRegex =
                              el.periodName.match(/\d{2}\/\d{2}\/\d{2}/)[0];
                            if (formattedDate !== dateRegex) continue;

                            const checkRule = rules[item.type_option];
                            if (!checkRule) continue;

                            const isWin = resultPrize.some((prize) =>
                              checkRule(item, prize)
                            );
                            if (isWin) {
                              await trx.query(
                                `UPDATE lotto_number SET status = 'suc' WHERE lotto_number_id = ? AND status_poy = 'SUC' AND status = 'wait'`,
                                [item.lotto_number_id]
                              );

                              const total = item.price * item.pay;

                              await trx.query(
                                `INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES (?, NOW(), ?, ?, ?)`,
                                [
                                  item.lotto_type_id,
                                  item.created_by,
                                  total,
                                  item.poy_code,
                                ]
                              );

                              await trx.query(
                                `UPDATE poy SET status_result = ? WHERE lotto_type_id = ? AND installment_date = CURDATE();`,
                                [1, item.lotto_type_id]
                              );
                            } else {
                              await trx.query(
                                `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
                                [
                                  item.lotto_type_id,
                                  item.lotto_number_id,
                                  "wait",
                                ]
                              );
                            }
                          }

                          // ดึงข้อมูลจาก prize_log เพื่ออัปเดตเครดิต
                          const [prizeLogRows] = await trx.query(
                            `SELECT lotto_type_id, lotto_date, created_by, total, poy_code 
                             FROM prize_log 
                             WHERE lotto_date = CURDATE() AND lotto_type_id = ?`,
                            [queryLottoClose.lotto_type_id]
                          );

                          for (const row of prizeLogRows) {
                            const [creditRows] = await trx.query(
                              `SELECT credit_balance FROM member WHERE id = ?`,
                              [row.created_by]
                            );

                            if (creditRows.length > 0) {
                              const creditBefore = parseFloat(
                                creditRows[0].credit_balance
                              );
                              const creditAfter =
                                creditBefore + parseFloat(row.total);

                              await trx.query(
                                `UPDATE member SET credit_balance = ? WHERE id = ?`,
                                [creditAfter, row.created_by]
                              );

                              await trx.query(
                                `INSERT INTO credit_log 
                                 (credit_previous, credit_after, created_by, lotto_type_id, installment, prize) 
                                 VALUES (?, ?, ?, ?, ?, ?)`,
                                [
                                  creditBefore,
                                  creditAfter,
                                  row.created_by,
                                  queryLottoClose.lotto_type_id,
                                  dateNow,
                                  row.total,
                                ]
                              );

                              console.log(
                                `เพิ่มเครดิตให้ user ${row.created_by} จำนวน ${row.total}`
                              );
                            }
                          }

                          await trx.commit();
                          // console.log("ประมวลผลสำเร็จ");
                        } catch (error) {
                          await trx.rollback();
                          console.error("เกิดข้อผิดพลาด (rollback):", error);
                        } finally {
                          trx.release();
                        }
                      };

                      processLotto();
                    }
                  }
                );
              }
            });
          }
        });
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

async function getDataYeeki() {
  var sql =
    "SELECT * FROM lotto_type WHERE open = 0 AND active = 1 AND lotto_type_name LIKE '%' ? '%' ";
  connection.query(sql, ["ยี่กี"], (error, result, fields) => {
    if (result != undefined) {
    }
  });
}
