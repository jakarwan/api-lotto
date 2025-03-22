const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("./verifyToken");
// const paginatedResults = require("./pagination");
const moment = require("moment");

// function dateChange(d) {
//   return moment(d).format("YYYY-MM-DD");
// }
const today = moment().format("YYYY-MM-DD");
const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

const generateId = function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  // console.log(result);
  return result;
};
router.get("/test", verifyToken, (req, res) => {
  return res.status(200).send({ status: true, data: "obj" });
});

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    // if (!err) {
    try {
      const phone = req.query.phone;
      const billId = req.query.billId;
      if (phone != undefined) {
        var sql = `SELECT * FROM member WHERE phone = ?`;
        connection.query(sql, [phone], (error, result, fields) => {
          if (result != undefined || result.length > 0) {
            if (billId != null) {
              var sql = `SELECT number as number, lotto_type_id, poy_code, installment_date, type_option, (SELECT lotto_type_name FROM lotto_type WHERE lotto_number.lotto_type_id = lotto_type.lotto_type_id) as lotto_type_name FROM lotto_number WHERE created_by = ? AND poy_code = ?`;
              connection.query(
                sql,
                // [result[0].id, billId, yesterday, today],
                [result[0].id, billId],
                (error, resultPoy, fields) => {
                  if (error) throw error;
                  console.log(resultPoy);
                  if (resultPoy.length > 0) {
                    const array = [];
                    resultPoy.forEach((item) => {
                      array.push({
                        number: item.number,
                        type_option: item.type_option,
                      });
                    });
                    const obj = {
                      poy_code: resultPoy[0].poy_code,
                      lotto_type_name: resultPoy[0].lotto_type_name,
                      installment_date: resultPoy[0].installment_date,
                      set_number: array,
                    };
                    // var sql = `SELECT IFNULL(SUM(total), 0) as total_result FROM lotto_number WHERE created_by = ? AND poy_code = ? AND installment_date >= ? AND installment_date <= ?`;
                    // connection.query(
                    //   sql,
                    //   [result[0].id, billId, yesterday, today],
                    //   (error, resultSum, fields) => {
                    //     if (error) throw error;
                    //     var sql = `SELECT IFNULL(SUM(total), 0) as total_result_wait FROM lotto_number WHERE created_by = ? AND poy_code = ? AND installment_date >= ? AND installment_date <= ? AND status = 'wait'`;
                    //     connection.query(
                    //       sql,
                    //       [result[0].id, billId, yesterday, today],
                    //       (error, resultSumWait, fields) => {
                    //         if (error) throw error;
                    //         return res.status(200).send({
                    //           status: true,
                    //           data: obj,
                    //           total_result: resultSum[0].total_result,
                    //           total_result_wait:
                    //             resultSumWait[0].total_result_wait,
                    //         });
                    //       }
                    //     );
                    //   }
                    // );
                    return res.status(200).send({ status: true, data: obj });
                  } else {
                    return res.status(200).send({ status: true, data: [] });
                  }
                }
              );
            } else {
              var sql = `SELECT GROUP_CONCAT(number ORDER BY number SEPARATOR ', ') AS number, lotto_type_id, poy_code, installment_date, (SELECT lt.lotto_type_name FROM lotto_type lt WHERE lt.lotto_type_id = ln.lotto_type_id LIMIT 1) AS lotto_type_name FROM lotto_number ln WHERE created_by = ? GROUP BY poy_code, lotto_type_id, installment_date;`;
              connection.query(
                sql,
                [result[0].id],
                (error, resultPoy, fields) => {
                  if (error) throw error;
                  return res
                    .status(200)
                    .send({ status: true, data: resultPoy });
                }
              );
            }

            // var sql = `SELECT lotto_type_id, poy_code, status, status_result, installment_date, (SELECT lotto_type_name FROM lotto_type WHERE poy.lotto_type_id = lotto_type.lotto_type_id) as lotto_type_name FROM poy WHERE created_by = ?`;
            // connection.query(
            //   sql,
            //   [result[0].id],
            //   (error, resultPoy, fields) => {
            //     if (resultPoy != undefined) {
            //       var sql = `SELECT * FROM lotto_number WHERE poy_code = ?`;
            //       connection.query(
            //         sql,
            //         [result[0].id],
            //         (error, resultPoy, fields) => {

            //         }
            //       );
            //     }
            //   }
            // );
          }
        });
      } else {
        return res.status(400).send({ status: false, msg: "กรุณาส่ง phone" });
      }
    } catch (e) {
      console.log(e);
    }
  });
});

router.post("/add-group-number", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    // if (!err) {
    const refsCode = generateId(10);
    try {
      const number = req.body.number;
      const phone = req.body.phone;
      const name = req.body.name;
      if (phone != undefined) {
        var sql = `SELECT * FROM member WHERE phone = ?`;
        connection.query(sql, [phone], (error, result, fields) => {
          if (result.length > 0) {
            if (number != undefined && number != null && number != "") {
              const arrFail = [];
              number.forEach((item) => {
                if (!isNaN(Number(item.number))) {
                  if (
                    item.type_option === "3 ตัวบน" &&
                    item.number.length != 3
                  ) {
                    arrFail.push({
                      number: item.number,
                      type_option: item.type_option,
                    });
                  } else if (
                    item.type_option === "3 ตัวโต๊ด" &&
                    item.number.length != 3
                  ) {
                    arrFail.push({
                      number: item.number,
                      type_option: item.type_option,
                    });
                  } else if (
                    item.type_option === "2 ตัวบน" &&
                    item.number.length != 2
                  ) {
                    arrFail.push({
                      number: item.number,
                      type_option: item.type_option,
                    });
                  } else if (
                    item.type_option === "2 ตัวล่าง" &&
                    item.number.length != 2
                  ) {
                    arrFail.push({
                      number: item.number,
                      type_option: item.type_option,
                    });
                  } else if (
                    item.type_option === "วิ่งบน" &&
                    item.number.length != 1
                  ) {
                    arrFail.push({
                      number: item.number,
                      type_option: item.type_option,
                    });
                  } else if (
                    item.type_option === "วิ่งล่าง" &&
                    item.number.length != 1
                  ) {
                    arrFail.push({
                      number: item.number,
                      type_option: item.type_option,
                    });
                  } else {
                    var sql = `INSERT INTO group_number (group_code, number, created_by, type_option, name) VALUES (?,?,?,?,?)`;
                    connection.query(
                      sql,
                      [
                        refsCode,
                        item.number,
                        result[0].id,
                        item.type_option,
                        name,
                      ],
                      (error, result, fields) => {
                        if (error) throw error;
                      }
                    );
                  }
                }
              });
              return res.status(200).send({
                status: true,
                msg: "สร้างเลขชุดสำเร็จ",
                fail: arrFail,
              });
            } else {
              return res
                .status(400)
                .send({ status: false, msg: "กรุณาส่ง number" });
            }
          } else {
            return res.status(400).send({ status: false, msg: "ไม่พบผู้ใช้" });
          }
        });
      } else {
        return res.status(400).send({ status: false, msg: "กรุณาส่ง phone" });
      }
    } catch (e) {
      console.log(e);
    }
  });
});

router.get("/group-history", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    // if (!err) {

    try {
      const phone = req.query.phone;
      const group_code = req.query.group_code;
      var sql = `SELECT * FROM member WHERE phone = ?`;
      connection.query(sql, [phone], (error, resultMember, fields) => {
        if (resultMember.length > 0) {
          if (group_code != null) {
            var sql = `SELECT g_id, group_code, created_at, name, number, type_option FROM group_number WHERE created_by = ? AND group_code = ?`;
            connection.query(
              sql,
              [resultMember[0].id, group_code],
              (error, result, fields) => {
                if (error) throw error;
                if (result.length > 0) {
                  const array = [];
                  result.forEach((item) => {
                    array.push({
                      number: item.number,
                      type_option: item.type_option,
                    });
                  });
                  const obj = {
                    group_code: result[0].group_code,
                    name: result[0].name,
                    created_at: result[0].created_at,
                    set_number: array,
                  };
                  return res.status(200).send({
                    status: true,
                    data: obj,
                  });
                }
              }
            );
          } else {
            var sql = `SELECT MAX(g_id) AS g_id, group_code, created_by, MAX(created_at) AS created_at, MAX(name) AS name, GROUP_CONCAT(number ORDER BY number SEPARATOR ', ') AS number FROM group_number WHERE created_by = ? GROUP BY group_code, created_by;`;
            connection.query(
              sql,
              [resultMember[0].id],
              (error, result, fields) => {
                if (error) throw error;
                return res.status(200).send({
                  status: true,
                  data: result,
                });
              }
            );
          }
        } else {
          return res.status(200).send({
            status: true,
            data: [],
          });
        }
      });
    } catch (e) {
      console.log(e);
    }
  });
});

router.delete("/delete-group", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    // if (!err) {
    try {
      const group_code = req.body.group_code;
      if (group_code != undefined) {
        var sql = `DELETE FROM group_number WHERE group_code = ?`;
        connection.query(sql, [group_code], (error, result, fields) => {
          return res.status(200).send({
            status: true,
            msg: "ลบเลขชุดสำเร็จ",
          });
        });
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง group_code" });
      }
    } catch (e) {
      console.log(e);
    }
  });
});

module.exports = router;
