const config = require("./config/config");
const { JOB_SCHEDULE } = config;
const cron = require("node-cron");
const connection = require("./config/connection");
const moment = require("moment");
const axios = require("axios");
const { updatePlayLimitMembers } = require("./routes/sql/lottoNumber");
var LocalStorage = require("node-localstorage").LocalStorage,
  localStorage = new LocalStorage("./scratch");

function dateChange(d) {
  return moment(d).format("YYYY-MM-DD");
}

cron.schedule(JOB_SCHEDULE, async () => {
  var sql =
    "UPDATE lotto_type SET closing_time = DATE_ADD(closing_time, INTERVAL 1 DAY) WHERE type_id != 2";
  connection.query(sql, (error, result, fields) => {
    var sql =
      "UPDATE lotto_type SET open = 1 WHERE type_id != 2";
    connection.query(sql, (error, result, fields) => {});
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

async function lottoNotify(lotto_name, prize) {
  const result = await axios({
    method: "post",
    url: "https://notify-api.line.me/api/notify",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer MolSYRMWl4X5WLmq0xxLDWNjYUY62Pqbj5m7YtERqET`,
    },
    data: `message=${lotto_name} \n
    3 ตัวบน: ${prize.prize3top}\n
    2 ตัวล่าง: ${prize.prize2bottom}\n
    `,
  })
    .then((response) => {
      // console.log(response);
    })
    .catch((err) => {
      console.log(err);
    });
}

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

async function getPrize() {
  var dateNow = moment(new Date()).format("YYYY-MM-DD");
  await axios
    .get("https://ruaymanage.com/api/v1/prize", {
      params: {
        date: dateNow,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "*",
      },
    })
    .then((response) => {
      // console.log(response.data.result);
      if (response.data.status) {
        var sql = "SELECT * FROM lotto_type WHERE open = 0 AND active = 1";
        connection.query(sql, (error, result, fields) => {
          if (result != undefined) {
            result.forEach((rs) => {
              var date = moment(new Date(rs.closing_time)).format("YYYY-MM-DD");
              response.data.result.forEach((el) => {
                if (
                  rs.lotto_type_name
                    .toLowerCase()
                    .replace(/[\s()]/g, "")
                    .replace("รอบ", "") ===
                  el.lotto_name
                    .toLowerCase()
                    .replace(/[\s()]/g, "")
                    .replace("รอบ", "")
                ) {
                  var sql =
                    "SELECT * FROM prize WHERE lotto_type_id = ? AND prize_time = ?";
                  connection.query(
                    sql,
                    [rs.lotto_type_id, dateNow],
                    (error, resultPrize, fields) => {
                      if (resultPrize == "") {
                        if (
                          el.top3 !== "---" &&
                          el.down2 !== "--" &&
                          el.top3 != null &&
                          el.down2 != null &&
                          el.top3 != "" &&
                          el.down2 != ""
                        ) {
                          var award3top = el.top3;
                          var type3top = "3 ตัวบน";
                          var type2bottom = "2 ตัวล่าง";
                          // if (el.award1.length > 3) {
                          //   award3top = el.award1.substr(3, 6);
                          // }
                          var sql =
                            "INSERT INTO prize (lotto_type_id, type3top, prize3top, type2bottom, prize2bottom, prize_time) VALUES(?, ?, ?, ?, ?, ?)";
                          connection.query(
                            sql,
                            [
                              rs.lotto_type_id,
                              type3top,
                              award3top,
                              type2bottom,
                              el.down2,
                              dateNow,
                            ],
                            (error, result, fields) => {
                              console.log("เพิ่มผลหวยสำเร็จ");
                            }
                          );
                        }
                      } else {
                        if (resultPrize[0].status == 0) {
                          var sql =
                            "SELECT ln.*, mb.credit_balance FROM lotto_number as ln JOIN lotto_type as lt ON ln.lotto_type_id = lt.lotto_type_id JOIN member as mb ON ln.created_by = mb.id WHERE ln.lotto_type_id = ? AND ln.status_poy = 'SUC' AND ln.installment_date = ?";
                          connection.query(
                            sql,
                            [rs.lotto_type_id, dateNow],
                            (error, resultLotto, fields) => {
                              var sqlUpdate = `UPDATE lotto_number SET status = 'suc' WHERE lotto_number_id = ? AND status_poy = 'SUC' AND status = 'wait'`;
                              resultLotto.forEach((item) => {
                                if (
                                  item.type_option === "วิ่งบน" &&
                                  dateChange(item.installment_date) === el.date
                                ) {
                                  const number = resultPrize.find((n) =>
                                    n.prize3top.toString().includes(item.number)
                                  );
                                  if (number != undefined) {
                                    connection.query(
                                      sqlUpdate,
                                      [item.lotto_number_id],
                                      (error, result, fields) => {}
                                    );

                                    // connection.query(
                                    //   `UPDATE prize SET status = 1 WHERE prize_id = ?`,
                                    //   [resultPrize[0].prize_id],
                                    //   (error, result, fields) => {
                                    //
                                    var sql =
                                      "INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES(?, ?, ?, ?, ?)";
                                    let total = 0;
                                    total = item.price * item.pay;
                                    connection.query(
                                      sql,
                                      [
                                        item.lotto_type_id,
                                        dateNow,
                                        item.created_by,
                                        total,
                                        item.poy_code,
                                      ],
                                      (error, result, fields) => {}
                                    );
                                    //   }
                                    // );
                                  } else {
                                    connection.query(
                                      `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
                                      [
                                        item.lotto_type_id,
                                        item.lotto_number_id,
                                        "wait",
                                      ],
                                      (error, result, fields) => {}
                                    );
                                  }
                                } else if (
                                  item.type_option === "วิ่งล่าง" &&
                                  dateChange(item.installment_date) === el.date
                                ) {
                                  const number = resultPrize.find((n) =>
                                    n.prize2bottom
                                      .toString()
                                      .includes(item.number)
                                  );
                                  if (number != undefined) {
                                    connection.query(
                                      sqlUpdate,
                                      [item.lotto_number_id],
                                      (error, result, fields) => {}
                                    );

                                    // connection.query(
                                    //   `UPDATE prize SET status = 1 WHERE prize_id = ?`,
                                    //   [resultPrize[0].prize_id],
                                    //   (error, result, fields) => {
                                    //
                                    var sql =
                                      "INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES(?, ?, ?, ?, ?)";
                                    let total = 0;
                                    total = item.price * item.pay;
                                    connection.query(
                                      sql,
                                      [
                                        item.lotto_type_id,
                                        dateNow,
                                        item.created_by,
                                        total,
                                        item.poy_code,
                                      ],
                                      (error, result, fields) => {}
                                    );
                                    //   }
                                    // );
                                  } else {
                                    connection.query(
                                      `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
                                      [
                                        item.lotto_type_id,
                                        item.lotto_number_id,
                                        "wait",
                                      ],
                                      (error, result, fields) => {}
                                    );
                                  }
                                } else if (
                                  item.type_option === "2 ตัวบน" &&
                                  dateChange(item.installment_date) === el.date
                                ) {
                                  const number = resultPrize.find((n) =>
                                    n.prize3top
                                      .toString()
                                      .substr(1)
                                      .includes(item.number)
                                  );
                                  if (number != undefined) {
                                    connection.query(
                                      sqlUpdate,
                                      [item.lotto_number_id],
                                      (error, result, fields) => {}
                                    );

                                    // connection.query(
                                    //   `UPDATE prize SET status = 1 WHERE prize_id = ?`,
                                    //   [resultPrize[0].prize_id],
                                    //   (error, result, fields) => {
                                    //
                                    var sql =
                                      "INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES(?, ?, ?, ?, ?)";
                                    let total = 0;
                                    total = item.price * item.pay;
                                    connection.query(
                                      sql,
                                      [
                                        item.lotto_type_id,
                                        dateNow,
                                        item.created_by,
                                        total,
                                        item.poy_code,
                                      ],
                                      (error, result, fields) => {}
                                    );
                                    //   }
                                    // );
                                  } else {
                                    connection.query(
                                      `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
                                      [
                                        item.lotto_type_id,
                                        item.lotto_number_id,
                                        "wait",
                                      ],
                                      (error, result, fields) => {}
                                    );
                                  }
                                } else if (
                                  item.type_option === "3 ตัวโต๊ด" &&
                                  dateChange(item.installment_date) === el.date
                                ) {
                                  const result = func3back(
                                    resultPrize[0].prize3top
                                  );
                                  if (result.indexOf(item.number) != -1) {
                                    // console.log(item.number, "ถูก 3 ตัวโต๊ด");
                                    connection.query(
                                      sqlUpdate,
                                      [item.lotto_number_id],
                                      (error, result, fields) => {}
                                    );

                                    // connection.query(
                                    //   `UPDATE prize SET status = 1 WHERE prize_id = ?`,
                                    //   [resultPrize[0].prize_id],
                                    //   (error, result, fields) => {
                                    //
                                    var sql =
                                      "INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES(?, ?, ?, ?, ?)";
                                    let total = 0;
                                    total = item.price * item.pay;
                                    connection.query(
                                      sql,
                                      [
                                        item.lotto_type_id,
                                        dateNow,
                                        item.created_by,
                                        total,
                                        item.poy_code,
                                      ],
                                      (error, result, fields) => {}
                                    );
                                    //   }
                                    // );
                                  } else {
                                    connection.query(
                                      `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
                                      [
                                        item.lotto_type_id,
                                        item.lotto_number_id,
                                        "wait",
                                      ],
                                      (error, result, fields) => {}
                                    );
                                    // console.log(item.number, "ไม่ถูก 3 ตัว");
                                  }
                                } else if (
                                  item.type_option === "3 ตัวบน" &&
                                  dateChange(item.installment_date) === el.date
                                ) {
                                  if (
                                    parseInt(item.number) ===
                                    parseInt(resultPrize[0].prize3top)
                                  ) {
                                    connection.query(
                                      sqlUpdate,
                                      [item.lotto_number_id],
                                      (error, result, fields) => {}
                                    );

                                    var sql =
                                      "INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES(?, ?, ?, ?, ?)";
                                    let total = 0;
                                    total = item.price * item.pay;
                                    connection.query(
                                      sql,
                                      [
                                        item.lotto_type_id,
                                        dateNow,
                                        item.created_by,
                                        total,
                                        item.poy_code,
                                      ],
                                      (error, result, fields) => {}
                                    );
                                    //   }
                                    // );
                                  } else {
                                    connection.query(
                                      `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
                                      [
                                        item.lotto_type_id,
                                        item.lotto_number_id,
                                        "wait",
                                      ],
                                      (error, result, fields) => {}
                                    );
                                  }
                                } else if (
                                  item.type_option === "2 ตัวล่าง" &&
                                  dateChange(item.installment_date) === el.date
                                ) {
                                  if (
                                    item.number === resultPrize[0].prize2bottom
                                  ) {
                                    connection.query(
                                      sqlUpdate,
                                      [item.lotto_number_id],
                                      (error, result, fields) => {}
                                    );

                                    var sql =
                                      "INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES(?, ?, ?, ?, ?)";
                                    let total = 0;
                                    total = item.price * item.pay;
                                    connection.query(
                                      sql,
                                      [
                                        item.lotto_type_id,
                                        dateNow,
                                        item.created_by,
                                        total,
                                        item.poy_code,
                                      ],
                                      (error, result, fields) => {}
                                    );
                                    //   }
                                    // );
                                  } else {
                                    connection.query(
                                      `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = ?`,
                                      [
                                        item.lotto_type_id,
                                        item.lotto_number_id,
                                        "wait",
                                      ],
                                      (error, result, fields) => {}
                                    );
                                  }
                                  // console.log("ถูก 2 ตัว");
                                } else {
                                  connection.query(
                                    `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND status = ? AND installment_date = DATE_FORMAT(NOW(), '%Y-%m-%d')`,
                                    [item.lotto_type_id, "wait"],
                                    (error, result, fields) => {}
                                  );
                                }
                              });
                              connection.query(
                                `UPDATE poy SET status_result = ? WHERE lotto_type_id = ? AND created_at`,
                                [1, rs.lotto_type_id, dateNow],
                                (error, result, fields) => {}
                              );
                              connection.query(
                                `UPDATE prize SET status = 1 WHERE prize_id = ?`,
                                [resultPrize[0].prize_id],
                                (error, result, fields) => {
                                  // return res.status(200).send({
                                  //   status: true,
                                  //   msg: "อัพเดทออกผลหวยสำเร็จ",
                                  // });
                                  var sql = `SELECT SUM(total * pay) as total, created_by FROM lotto_number WHERE installment_date = ? AND lotto_type_id = ? AND status = 'suc' GROUP BY created_by`;
                                  connection.query(
                                    sql,
                                    [dateNow, rs.lotto_type_id],
                                    (error, resultPrizeLog, fields) => {
                                      let totalCredit = 0;
                                      resultPrizeLog.forEach((item) => {
                                        connection.query(
                                          `SELECT credit_balance FROM member WHERE id = ?`,
                                          [item.created_by],
                                          (error, resultCredit, fields) => {
                                            if (resultCredit != "") {
                                              totalCredit =
                                                parseFloat(
                                                  resultCredit[0].credit_balance
                                                ) + parseFloat(item.total);
                                              connection.query(
                                                `UPDATE member SET credit_balance = ? WHERE id = ?`,
                                                [totalCredit, item.created_by],
                                                (error, result, fields) => {
                                                  console.log(
                                                    `อัพเดทกระเป๋าสำเร็จ`
                                                  );
                                                }
                                              );
                                              connection.query(
                                                `INSERT INTO credit_log (credit_previous,credit_after,created_by,lotto_type_id,installment,prize) VALUES (?,?,?,?,?,?)`,
                                                [
                                                  resultCredit[0]
                                                    .credit_balance,
                                                  totalCredit,
                                                  item.created_by,
                                                  rs.lotto_type_id,
                                                  dateNow,
                                                  item.total,
                                                ],
                                                (error, result, fields) => {}
                                              );
                                            }
                                          }
                                        );
                                      });
                                    }
                                  );
                                  lottoNotify(
                                    rs.lotto_type_name,
                                    resultPrize[0]
                                  );
                                  console.log(
                                    `อัพเดทออกผลหวย ${rs.lotto_type_name} สำเร็จ`
                                  );
                                }
                              );
                            }
                          );
                        }
                      }
                    }
                  );
                }
              });
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
