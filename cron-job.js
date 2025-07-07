const config = require("./config/config");
const { JOB_SCHEDULE } = config;
const cron = require("node-cron");
const connection = require("./config/connection");
const moment = require("moment");
// const moment = require("moment-timezone");
const axios = require("axios");
const { updatePlayLimitMembers } = require("./routes/sql/lottoNumber");

async function closeTimeLottoThai() {
  try {
    const now = moment(new Date());
    const day = now.date();
    // if (day === 2 || day === 17) {
      // 1️⃣ ดึงข้อมูลหวยไทยทั้งหมด
      const [lottoTypes] = await connection.promise().query(
        `
      SELECT lotto_type_id, lotto_type_name, closing_time 
      FROM lotto_type
      WHERE type_id = 2
      `
      );

      // 2️⃣ loop เพื่ออัปเดตแต่ละ closing_time ของหวยไทย
      for (const item of lottoTypes) {
        // เอาแค่เวลา (HH:mm:ss) จาก closing_time
        const timePart = moment(item.closing_time).format("HH:mm:ss");
        if (!timePart || timePart === "Invalid date") continue;

        let newDate = now.format("YYYY-MM-") + day; // เริ่มด้วยวันปัจจุบัน

        // เงื่อนไขพิเศษ: ถ้า day = 2 ให้ไปวันที่ 16
        if (day === 2) {
          newDate = now.format("YYYY-MM-") + "16";
        }
        else if (day <= 16) {
          newDate = now.format("YYYY-MM-") + "16";
        }
        else if (day >= 17) {
          newDate = now.clone().add(1, "month").format("YYYY-MM-") + "01";
        }
        // ถ้า day = 17 ให้ไปวันที่ 1 ของเดือนถัดไป
        // else if (day === 17) {
        //   newDate = now.clone().add(1, "month").format("YYYY-MM-") + "01";
        // }
        
        // 3️⃣ update closing_time ของแต่ละหวย
        await connection.promise().query(
          `
        UPDATE lotto_type
        SET closing_time = CONCAT(?, ' ', ?),
            installment_date = ?,
            open = 1
        WHERE lotto_type_id = ?
      `,
          [newDate, timePart, newDate, item.lotto_type_id]
        );

        console.log(
          `✅ อัปเดต closing_time ของหวยไทย ${item.lotto_type_name} (ID: ${item.lotto_type_id}) => ${newDate} ${timePart}`
        );
      }

      console.log("🎉 ปรับเวลาหวยไทยทั้งหมดเรียบร้อย!");
    // }
  } catch (err) {
    console.error("เกิดข้อผิดพลาดใน closeTime():", err);
  }
}

async function updateTime() {
  try {
    // อัปเดต closing_time
    await connection.promise().query(
      `
    UPDATE lotto_type
SET closing_time = CONCAT(
    DATE(
        IF(TIME(closing_time) < '06:00:00', DATE_ADD(CURDATE(), INTERVAL 1 DAY), CURDATE())
    ),
    ' ',
    TIME(closing_time)
)
WHERE type_id != 2;

  `
    );

    // อัปเดต installment_date
    await connection.promise().query(
      `
    UPDATE lotto_type
    SET installment_date = CURDATE()
    WHERE type_id != 2
  `
    );

    // เปิดหวย
    await connection.promise().query(`
    UPDATE lotto_type
    SET open = 1
    WHERE type_id != 2
  `);

    console.log(`Update Close Lotto 05.00`);

    const params = [50];
    await updatePlayLimitMembers(params);
  } catch (err) {
    console.error("CRON ERROR:", err);
  }
}

updateTime();
// closeTimeLottoThai();

async function resetCloseNumber() {
  try {
    // เปิดหวย
    await connection.promise().query(`
    UPDATE close_number cn
JOIN lotto_type lt ON lt.lotto_type_id = cn.lotto_type_id
SET
  cn.remaining_limit = cn.buy_limit,
  cn.series = 1
WHERE lt.type_id != 2;

  `);

    console.log(`Update Reset Close Number 05.00`);
  } catch (err) {
    console.error("CRON ERROR:", err);
  }
}

// cron job reset lotto after 05.00
cron.schedule("0 5 * * *", async () => {
  await updateTime();
  await resetCloseNumber();
  // await closeTimeLottoThai();
});

// cron job add affiliate today
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

// cron job check close lotto
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
          (error, result, fields) => {}
        );
      });
      console.log("Update lotto closing");
    }
  });

  var sql =
    "SELECT lotto_type_id, lotto_type_name, closing_time FROM lotto_type";
  connection.query(sql, (error, result, fields) => {
    result.forEach((item) => {
      countDown(item.closing_time, item.lotto_type_id);
    });
    console.log("Update lotto time every 1 minute");
  });

  function countDown(date, id) {
    if (date != null && id != null) {
      var dd = moment(new Date(date)).format("YYYY-MM-DD HH:mm:ss");
      var countDownDate = new Date(dd).getTime();
      var now = new Date().getTime();
      var distance = countDownDate - now;
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

// ตรวจสอบว่าเข้าเงื่อนไขตัวเลขไหน
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
  // "3 ตัวล่าง": (item, prize) => {
  //   const prize3front =
  //     prize.prize3bottom.find((p) => p.prize3front)?.prize3front || [];
  //   const prize3after =
  //     prize.prize3bottom.find((p) => p.prize3after)?.prize3after || [];
  //   return (
  //     item.number === prize3front[0] ||
  //     item.number === prize3front[1] ||
  //     item.number === prize3after[0] ||
  //     item.number === prize3after[1]
  //   );
  // },
  "2 ตัวล่าง": (item, prize) => item.number === prize.prize2bottom,
  // "4 ตัวโต๊ด": (item, prize) =>
  //   func4back(prize.prize6digit.slice(2)).includes(item.number),
  // "4 ตัวบน": (item, prize) =>
  //   parseInt(item.number) === parseInt(prize.prize6digit.slice(2)),
};

// cronjob auto prize
cron.schedule("*/5 * * * *", async () => {
  console.log("[CRON] Running getPrize()");
  await getPrize();
  await getPrizeYeekee();
});

// getPrizeYeekee();
// getPrize();

function formatInstallmentDisplay(dateStr) {
  const date = moment(dateStr);
  return date.format("DD/MM") + "/" + (date.year() + 543).toString().slice(-2);
}

// ออกผลหวยยี่กีและอัพเดทเครดิต
async function getPrizeYeekee() {
  try {
    const [lottoTypes] = await connection.promise().query(
      `SELECT * 
FROM lotto_type 
WHERE open = 0 
  AND active = 1 
  AND installment_date = (
    CASE 
      WHEN CURTIME() < '06:00:00' THEN DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      ELSE CURDATE()
    END
  )
  AND url = 'YEEKEE';`
    );
    for (const el of lottoTypes) {
      const [existingPrize] = await connection.promise().query(
        `SELECT * FROM prize WHERE lotto_type_id = ? AND prize_time = (
    CASE 
      WHEN CURTIME() < '06:00:00' THEN DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      ELSE CURDATE()
    END
  )`,
        [el.lotto_type_id]
      );
      if (existingPrize.length === 0) {
        await insertRandomYeekeePrize(
          el.lotto_type_id,
          el.installment_date,
          30
        ); // ใส่เปอร์เซ็นต์ที่นี่
      }

      await processLotto(el.lotto_type_id, el.installment_date, {
        periodName: formatInstallmentDisplay(el.installment_date),
      });
    }
  } catch (error) {
    console.log("ERROR :", error);
  }
}

/////////////////// ออกผลหวยออโต้ /////////////////////////////
async function getPrize() {
  // const today = moment().format("YYYY-MM-DD");
  // const todayDisplay = moment().format("YYYYMMDD");
  const nowText = moment().format("YYYY-MM-DD HH:mm:ss");

  const now = moment();
  const installmentDate =
    now.format("HH:mm:ss") < "06:00:00"
      ? now.clone().subtract(1, "day").format("YYYY-MM-DD")
      : now.format("YYYY-MM-DD");

  const todayDisplay =
    now.format("HH:mm:ss") < "06:00:00"
      ? now.clone().subtract(1, "day").format("YYYYMMDD")
      : now.format("YYYYMMDD");
  // console.log(todayDisplay, "todayDisplay");
  try {
    const response = await axios.get(
      `https://api.huaykk.live/info/getResult/${todayDisplay}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept-Encoding": "*",
        },
      }
    );
    if (!response.data.success) return;

    const [lottoTypes] = await connection
      .promise()
      .query(
        "SELECT * FROM lotto_type WHERE open = 0 AND active = 1 AND DATE(closing_time) = CURDATE()"
      );
    for (const el of response.data.info) {
      const match = lottoTypes.find((item) => {
        const closingDate = moment(item.installment_date);
        const formatted =
          closingDate.format("DD/MM") +
          "/" +
          (closingDate.year() + 543).toString().slice(-2);
        const period = el.periodName.match(/\d{2}\/\d{2}\/\d{2}/)?.[0];
        return item.url === el.productCode && formatted === period;
      });
      if (!match) continue;

      const [existingPrize] = await connection
        .promise()
        .query(
          "SELECT * FROM prize WHERE lotto_type_id = ? AND prize_time = ?",
          [match.lotto_type_id, installmentDate]
        );

      if (
        existingPrize.length === 0 &&
        el.award1 !== "xxx" &&
        el.award2 !== "xx"
      ) {
        const award3bottom =
          el.award3 && el.award4
            ? [
                { type3front: "3 ตัวหน้า", prize3front: [el.award3] },
                { type3after: "3 ตัวหลัง", prize3after: [el.award4] },
              ]
            : [];

        await connection.promise().query(
          `INSERT INTO prize (lotto_type_id, prize6digit, prize3bottom, type3top, prize3top, type2bottom, prize2bottom, prize_time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            match.lotto_type_id,
            el.award1.length === 6 ? el.award1 : null,
            award3bottom.length ? JSON.stringify(award3bottom) : null,
            "3 ตัวบน",
            el.award1.length === 6 ? el.award1.slice(-3) : el.award1,
            "2 ตัวล่าง",
            el.award2,
            match.installment_date,
          ]
        );
        console.log(`[✔] เพิ่มผลหวย ${match.lotto_type_name} ${nowText}`);
      }

      await processLotto(match.lotto_type_id, installmentDate, el);
    }
  } catch (err) {
    console.error("getPrize error:", err);
  }
}

// async function getPrize() {
//   const now = moment();
//   const prizeDate =
//     now.hour() < 6
//       ? now.clone().subtract(1, "day").format("YYYY-MM-DD")
//       : now.format("YYYY-MM-DD");

//   try {
//     const response = await axios.get(
//       `https://api.huaykk.live/info/getResult/${now.format("YYYYMMDD")}`,
//       {
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//           "Accept-Encoding": "*",
//         },
//       }
//     );
//     if (!response.data.success) return;

//     const [lottoTypes] = await connection.promise().query(
//       `
//       SELECT * FROM lotto_type
//       WHERE open = 0 AND active = 1 AND DATE(installment_date) = ?
//     `,
//       [prizeDate]
//     );

//     for (const el of response.data.info) {
//       const match = lottoTypes.find((item) => {
//         const expected =
//           moment(item.installment_date).format("DD/MM") +
//           "/" +
//           (moment(item.installment_date).year() + 543).toString().slice(-2);
//         const actual = el.periodName.match(/\d{2}\/\d{2}\/\d{2}/)?.[0];
//         return item.url === el.productCode && expected === actual;
//       });

//       if (!match || el.award1 === "xxx" || el.award2 === "xx") continue;

//       const [existingPrize] = await connection
//         .promise()
//         .query(
//           "SELECT * FROM prize WHERE lotto_type_id = ? AND prize_time = ?",
//           [match.lotto_type_id, prizeDate]
//         );

//       if (existingPrize.length === 0) {
//         const prize3bottom =
//           el.award3 && el.award4
//             ? JSON.stringify([
//                 { type3front: "3 ตัวหน้า", prize3front: [el.award3] },
//                 { type3after: "3 ตัวหลัง", prize3after: [el.award4] },
//               ])
//             : null;

//         await connection.promise().query(
//           `
//           INSERT INTO prize (lotto_type_id, prize6digit, prize3bottom, type3top, prize3top, type2bottom, prize2bottom, prize_time)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//         `,
//           [
//             match.lotto_type_id,
//             el.award1.length === 6 ? el.award1 : null,
//             prize3bottom,
//             "3 ตัวบน",
//             el.award1.length === 6 ? el.award1.slice(-3) : el.award1,
//             "2 ตัวล่าง",
//             el.award2,
//             prizeDate,
//           ]
//         );

//         console.log(`[✔] เพิ่มผลหวย ${match.lotto_type_name} ${prizeDate}`);
//       }

//       await processLotto(match.lotto_type_id, prizeDate, el);
//     }
//   } catch (err) {
//     console.error("getPrize error:", err);
//   }
// }

// process ออกผลหวยและอัพเดทเครดิต
async function processLotto(lotto_type_id, prizeDate, el) {
  const conn = await connection.promise().getConnection();
  try {
    await conn.beginTransaction();

    const [[prize]] = await conn.query(
      `SELECT * FROM prize WHERE lotto_type_id = ? AND prize_time = ? AND status = 0`,
      [lotto_type_id, prizeDate]
    );

    if (!prize) {
      await conn.rollback();
      return;
    }

    const [numbers] = await conn.query(
      `SELECT ln.* FROM lotto_number ln
       JOIN lotto_type lt ON ln.lotto_type_id = lt.lotto_type_id
       WHERE ln.lotto_type_id = ? AND ln.status_poy = 'SUC' AND ln.installment_date = lt.installment_date`,
      [lotto_type_id]
    );

    for (const item of numbers) {
      const date = moment(item.installment_date);
      const formatted =
        date.format("DD/MM") + "/" + (date.year() + 543).toString().slice(-2);
      const expected = el.periodName.match(/\d{2}\/\d{2}\/\d{2}/)?.[0];
      if (formatted !== expected) continue;

      const checkRule = rules[item.type_option];
      if (!checkRule) continue;

      const isWin = checkRule(item, prize);
      if (isWin) {
        const total = item.price * item.pay;
        await conn.query(
          `UPDATE lotto_number SET status = 'suc' WHERE lotto_number_id = ? AND status = 'wait'`,
          [item.lotto_number_id]
        );
        await conn.query(
          `INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES (?, ?, ?, ?, ?)`,
          [lotto_type_id, prizeDate, item.created_by, total, item.poy_code]
        );
      } else {
        await conn.query(
          `UPDATE lotto_number SET status = 'fail' WHERE lotto_type_id = ? AND lotto_number_id = ? AND status = 'wait'`,
          [lotto_type_id, item.lotto_number_id]
        );
      }
    }

    await conn.query(
      `UPDATE poy SET status_result = 1 WHERE lotto_type_id = ? AND installment_date = ?`,
      [lotto_type_id, prizeDate]
    );
    await conn.query(`UPDATE prize SET status = 1 WHERE prize_id = ?`, [
      prize.prize_id,
    ]);

    const [winners] = await conn.query(
      `SELECT created_by, SUM(total) AS total, MAX(poy_code) AS poy_code FROM prize_log WHERE lotto_type_id = ? AND lotto_date = ? GROUP BY created_by`,
      [lotto_type_id, prizeDate]
    );

    for (const user of winners) {
      const [[member]] = await conn.query(
        `SELECT credit_balance FROM member WHERE id = ?`,
        [user.created_by]
      );
      const creditBefore = parseFloat(member.credit_balance);
      const creditAfter = creditBefore + parseFloat(user.total);

      await conn.query(`UPDATE member SET credit_balance = ? WHERE id = ?`, [
        creditAfter,
        user.created_by,
      ]);
      await conn.query(
        `INSERT INTO credit_log (credit_previous, credit_after, created_by, lotto_type_id, note, installment, prize, poy_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          creditBefore,
          creditAfter,
          user.created_by,
          lotto_type_id,
          `ถูกรางวัล ${user.total} บาท ${user.poy_code}`,
          prizeDate,
          user.total,
          user.poy_code,
        ]
      );
    }

    await conn.commit();
    console.log(`[✔] อัปเดตผลหวยและเครดิต ${lotto_type_id}`);
  } catch (err) {
    await conn.rollback();
    console.error("processLotto error:", err);
  } finally {
    conn.release();
  }
}

// async function processLotto(lotto_type_id, prizeDate, el) {
//   const conn = await connection.promise().getConnection();
//   try {
//     await conn.beginTransaction();

//     const [[prize]] = await conn.query(
//       "SELECT * FROM prize WHERE lotto_type_id = ? AND prize_time = ? AND status = 0",
//       [lotto_type_id, prizeDate]
//     );

//     if (!prize) {
//       await conn.rollback();
//       return;
//     }

//     const [numbers] = await conn.query(
//       `SELECT * FROM lotto_number WHERE lotto_type_id = ? AND status_poy = 'SUC' AND installment_date = ?`,
//       [lotto_type_id, prizeDate]
//     );

//     for (const item of numbers) {
//       const expected = el.periodName.match(/\d{2}\/\d{2}\/\d{2}/)?.[0];
//       const formatted =
//         moment(item.installment_date).format("DD/MM") +
//         "/" +
//         (moment(item.installment_date).year() + 543).toString().slice(-2);
//       if (formatted !== expected) continue;

//       const rule = rules[item.type_option];
//       if (!rule) continue;

//       const isWin = rule(item, prize);
//       if (isWin) {
//         const total = item.price * item.pay;
//         await conn.query(
//           `UPDATE lotto_number SET status = 'suc' WHERE lotto_number_id = ? AND status = 'wait'`,
//           [item.lotto_number_id]
//         );
//         await conn.query(
//           `INSERT INTO prize_log (lotto_type_id, lotto_date, created_by, total, poy_code) VALUES (?, ?, ?, ?, ?)`,
//           [lotto_type_id, prizeDate, item.created_by, total, item.poy_code]
//         );
//       } else {
//         await conn.query(
//           `UPDATE lotto_number SET status = 'fail' WHERE lotto_number_id = ? AND status = 'wait'`,
//           [item.lotto_number_id]
//         );
//       }
//     }

//     await conn.query("UPDATE prize SET status = 1 WHERE prize_id = ?", [
//       prize.prize_id,
//     ]);
//     await conn.query(
//       "UPDATE poy SET status_result = 1 WHERE lotto_type_id = ? AND installment_date = ?",
//       [lotto_type_id, prizeDate]
//     );

//     const [winners] = await conn.query(
//       `SELECT created_by, SUM(total) as total, MAX(poy_code) as poy_code
//        FROM prize_log
//        WHERE lotto_type_id = ? AND lotto_date = ?
//        GROUP BY created_by`,
//       [lotto_type_id, prizeDate]
//     );

//     for (const win of winners) {
//       const [[member]] = await conn.query(
//         "SELECT credit_balance FROM member WHERE id = ?",
//         [win.created_by]
//       );
//       const creditBefore = parseFloat(member.credit_balance);
//       const creditAfter = creditBefore + parseFloat(win.total);

//       await conn.query("UPDATE member SET credit_balance = ? WHERE id = ?", [
//         creditAfter,
//         win.created_by,
//       ]);
//       await conn.query(
//         `INSERT INTO credit_log (credit_previous, credit_after, created_by, lotto_type_id, note, installment, prize, poy_code)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           creditBefore,
//           creditAfter,
//           win.created_by,
//           lotto_type_id,
//           `ถูกรางวัล ${win.total}`,
//           prizeDate,
//           win.total,
//           win.poy_code,
//         ]
//       );
//     }

//     await conn.commit();
//     console.log(`[✔] ประมวลผลรางวัล ${lotto_type_id}`);
//   } catch (err) {
//     await conn.rollback();
//     console.error("processLotto error:", err);
//   } finally {
//     conn.release();
//   }
// }
/////////////////// ออกผลหวยออโต้ /////////////////////////////

// ออกผลหวยยี่กีแบบสุ่ม
async function insertRandomYeekeePrize(
  lotto_type_id,
  closing_time,
  winPercent = 30
) {
  try {
    const [poys] = await connection.promise().query(
      `SELECT DISTINCT number FROM lotto_number
     WHERE lotto_type_id = ? AND status_poy = 'SUC' AND DATE(installment_date) = CURDATE()`,
      [lotto_type_id]
    );

    if (poys.length === 0) {
      // ไม่มีโพยเลย — สุ่มทั้งหมด
      const prize3top = randomDigits(3);
      const prize2bottom = randomDigits(2);
      await insertPrizeRecord(
        lotto_type_id,
        prize3top,
        prize2bottom,
        closing_time
      );
      return;
    }

    // กรองโพยแยกตามประเภทที่สนใจ
    const top3 = poys.filter((x) => x.number.length === 3);
    const bottom2 = poys.filter((x) => x.number.length === 2);

    // สุ่มตามเปอร์เซ็นต์
    const winCount3 = Math.ceil((winPercent / 100) * top3.length);
    const winCount2 = Math.ceil((winPercent / 100) * bottom2.length);

    const top3Candidates = shuffle(top3).slice(0, winCount3);
    const bottom2Candidates = shuffle(bottom2).slice(0, winCount2);

    const prize3top =
      top3Candidates.length > 0
        ? top3Candidates[Math.floor(Math.random() * top3Candidates.length)]
            .number
        : randomDigits(3);

    const prize2bottom =
      bottom2Candidates.length > 0
        ? bottom2Candidates[
            Math.floor(Math.random() * bottom2Candidates.length)
          ].number
        : randomDigits(2);

    await insertPrizeRecord(
      lotto_type_id,
      prize3top,
      prize2bottom,
      closing_time
    );
  } catch (error) {
    console.log("ERROR", error);
  }
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function randomDigits(length) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

// insert prize ยี่กี
async function insertPrizeRecord(
  lotto_type_id,
  prize3top,
  prize2bottom,
  prize_time
) {
  // สร้าง JSON 3 ตัวหน้า-หลังให้เป็น null หรือเว้นไว้ก่อน
  const prize3bottom = null;
  try {
    await connection.promise().query(
      `INSERT INTO prize (lotto_type_id, prize6digit, prize3bottom, type3top, prize3top, type2bottom, prize2bottom, prize_time)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?)`,
      [
        lotto_type_id,
        prize3bottom,
        "3 ตัวบน",
        prize3top,
        "2 ตัวล่าง",
        prize2bottom,
        prize_time,
      ]
    );

    console.log(
      `[✔] ออกผลสุ่มยี่กี lotto_type_id=${lotto_type_id} | 3ตัวบน: ${prize3top} | 2ตัวล่าง: ${prize2bottom}`
    );
  } catch (error) {
    console.log("ERROR", error);
  }
}
