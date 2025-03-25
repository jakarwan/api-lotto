const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../../../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../../verifyToken");
const paginatedResults = require("../../pagination");
const moment = require("moment");
// const moment = require("moment");

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const lotto_type_id = req.query.lotto_type_id;
      const prize_number = req.query.prize_number;
      const page = req.query.page;
      const perPage = req.query.perPage;
      // last query
      //SELECT * FROM Table ORDER BY ID DESC LIMIT 1
      if (page != null && perPage != null) {
        if (lotto_type_id != undefined) {
          var sql =
            "SELECT p.*, lt.lotto_type_name, lt.lotto_type_img, lt.closing_time, (SELECT name FROM member WHERE p.created_by = id) as name, (SELECT familyName FROM member WHERE p.created_by = id) as familyName FROM prize as p JOIN lotto_type as lt ON p.lotto_type_id = lt.lotto_type_id WHERE lt.lotto_type_id = ? ORDER BY p.created_at DESC";
        } else if (prize_number != undefined) {
          var sql =
            "SELECT p.*, lt.lotto_type_name, lt.lotto_type_img, lt.closing_time, (SELECT name FROM member WHERE p.created_by = id) as name, (SELECT familyName FROM member WHERE p.created_by = id) as familyName FROM prize as p JOIN lotto_type as lt ON p.lotto_type_id = lt.lotto_type_id WHERE p.prize3top LIKE '%' ? '%' OR p.prize2bottom LIKE '%' ? '%'";
        } else {
          var sql =
            "SELECT p.*, lt.lotto_type_name, lt.lotto_type_img, lt.closing_time, (SELECT name FROM member WHERE p.created_by = id) as name, (SELECT familyName FROM member WHERE p.created_by = id) as familyName FROM prize as p JOIN lotto_type as lt ON p.lotto_type_id = lt.lotto_type_id ORDER BY p.created_at DESC";
        }

        connection.query(
          sql,
          [lotto_type_id ?? prize_number, prize_number],
          (error, result, fields) => {
            if (result === undefined) {
              return res.status(400).send({ status: false });
            } else {
              const data = paginatedResults(req, res, result);
              return res.status(200).send({ status: true, data });
            }
          }
        );
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง page, perPage" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/prize-result", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const lotto_type_id = req.query.lotto_type_id;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      const page = req.query.page;
      const perPage = req.query.perPage;
      const status = req.query.status;
      // last query
      //SELECT * FROM Table ORDER BY ID DESC LIMIT 1
      // if (page != null && perPage != null) {
      var d = moment(new Date()).format("YYYY-MM-DD");
      if (
        lotto_type_id != undefined &&
        startDate != null &&
        endDate != null &&
        status == null
      ) {
        console.log("0");
        // status = 'suc'
        // var sql = `SELECT poy_code, created_at, status_poy, status, lotto_type_id, (SELECT lotto_type_name FROM lotto_type WHERE lotto_type_id = ln.lotto_type_id) as lotto_type_name, (SELECT SUM(price * pay) FROM lotto_number WHERE poy_code = ln.poy_code AND status = 'suc') as sum_prize, (SELECT SUM(total) FROM lotto_number WHERE poy_code = ln.poy_code AND status != 'close') as sum_total, (SELECT SUM(discount) FROM lotto_number WHERE poy_code = ln.poy_code AND status != 'close') as sum_discount, (SELECT note FROM poy WHERE poy_code = ln.poy_code) as note, (SELECT name FROM member WHERE id = ln.created_by) as name, (SELECT familyName FROM member WHERE id = ln.created_by) as familyName, (SELECT status_result FROM poy WHERE poy_code = ln.poy_code) as status_result, (SELECT SUM(aff_amount) FROM aff_log WHERE poy_code = ln.poy_code) as aff_amount FROM lotto_number ln WHERE lotto_type_id = ? AND date_lotto >= ? AND date_lotto <= ? GROUP BY poy_code ORDER BY created_at DESC`;
        var sql = `SELECT p.poy_code, MAX(p.created_at) AS created_at, MAX(p.status) AS status_poy, MAX(p.lotto_type_id) AS lotto_type_id, MAX(p.status_result) AS status_result, MAX(p.total) AS total, MAX(p.discount) AS sum_discount, MAX(p.price) AS sum_total, MAX(p.note) AS note, MAX(lt.lotto_type_name) AS lotto_type_name, MAX(mb.name) AS name, MAX(mb.familyName) AS familyName, (SELECT SUM(total * pay) FROM lotto_number WHERE status = 'suc' AND installment_date BETWEEN '${startDate}' AND '${endDate}' AND lotto_type_id = ${lotto_type_id} AND poy_code = p.poy_code) AS sum_prize FROM poy AS p LEFT JOIN lotto_type AS lt ON p.lotto_type_id = lt.lotto_type_id LEFT JOIN member AS mb ON p.created_by = mb.id LEFT JOIN prize_log AS pl ON p.poy_code = pl.poy_code WHERE p.lotto_type_id = ? AND p.date_lotto BETWEEN ? AND ? GROUP BY p.poy_code ORDER BY MAX(lt.closing_time) DESC;`;
        connection.query(
          sql,
          [lotto_type_id, startDate, endDate],
          (error, result, fields) => {
            if (error) return console.log(error);
            if (result === undefined) {
              return res.status(400).send({ status: false });
            } else {
              // const data = paginatedResults(req, res, result);
              return res.status(200).send({ status: true, data: result });
            }
          }
        );
      } else if (
        lotto_type_id != undefined &&
        startDate != null &&
        endDate != null &&
        status != null
      ) {
        console.log("1");
        // status = 'suc'
        // var sql = `SELECT poy_code, created_at, status_poy, status, lotto_type_id, (SELECT lotto_type_name FROM lotto_type WHERE lotto_type_id = ln.lotto_type_id) as lotto_type_name, (SELECT SUM(price * pay) FROM lotto_number WHERE poy_code = ln.poy_code AND status = 'suc') as sum_prize, (SELECT SUM(total) FROM lotto_number WHERE poy_code = ln.poy_code AND status != 'close') as sum_total, (SELECT SUM(discount) FROM lotto_number WHERE poy_code = ln.poy_code AND status != 'close') as sum_discount, (SELECT note FROM poy WHERE poy_code = ln.poy_code) as note, (SELECT name FROM member WHERE id = ln.created_by) as name, (SELECT familyName FROM member WHERE id = ln.created_by) as familyName, (SELECT status_result FROM poy WHERE poy_code = ln.poy_code) as status_result, (SELECT SUM(aff_amount) FROM aff_log WHERE poy_code = ln.poy_code) as aff_amount FROM lotto_number ln WHERE lotto_type_id = ? AND date_lotto >= ? AND date_lotto <= ? AND status = ? GROUP BY poy_code ORDER BY created_at DESC`;
        var sql = `SELECT 
    p.poy_code, 
    MAX(p.created_at) AS created_at, 
    p.status AS status_poy, 
    p.lotto_type_id, 
    p.status_result, 
    p.total, 
    p.discount AS sum_discount, 
    p.price AS sum_total, 
    p.note, 
    MAX(lt.lotto_type_name) AS lotto_type_name, 
    MAX(mb.name) AS name, 
    MAX(mb.familyName) AS familyName, 
    (SELECT SUM(total * pay) 
     FROM lotto_number 
     WHERE status = 'suc' 
           AND installment_date BETWEEN '${startDate}' AND '${endDate}'
           AND lotto_type_id = ${lotto_type_id} 
           AND poy_code = p.poy_code) AS sum_prize
FROM poy AS p 
LEFT JOIN lotto_type AS lt ON p.lotto_type_id = lt.lotto_type_id 
LEFT JOIN member AS mb ON p.created_by = mb.id 
LEFT JOIN prize_log AS pl ON p.poy_code = pl.poy_code 
WHERE p.lotto_type_id = ? 
      AND p.date_lotto BETWEEN ? AND ? 
GROUP BY p.poy_code, p.status, p.lotto_type_id, p.status_result, p.total, p.discount, p.price, p.note  
HAVING sum_prize IS NOT NULL
ORDER BY MAX(lt.closing_time) DESC`;
        connection.query(
          sql,
          [lotto_type_id, startDate, endDate],
          (error, result, fields) => {
            if (error) return console.log(error);
            if (result === undefined) {
              return res.status(400).send({ status: false });
            } else {
              // const data = paginatedResults(req, res, result);
              return res.status(200).send({ status: true, data: result });
            }
          }
        );
      } else if (startDate != null && endDate != null && status != null) {
        console.log("2");
        // status = 'suc'
        // var sql = `SELECT poy_code, created_at, status_poy, status, lotto_type_id, (SELECT lotto_type_name FROM lotto_type WHERE lotto_type_id = ln.lotto_type_id) as lotto_type_name, (SELECT SUM(price * pay) FROM lotto_number WHERE poy_code = ln.poy_code AND status = 'suc') as sum_prize, (SELECT SUM(total) FROM lotto_number WHERE poy_code = ln.poy_code AND status != 'close') as sum_total, (SELECT SUM(discount) FROM lotto_number WHERE poy_code = ln.poy_code AND status != 'close') as sum_discount, (SELECT note FROM poy WHERE poy_code = ln.poy_code) as note, (SELECT name FROM member WHERE id = ln.created_by) as name, (SELECT familyName FROM member WHERE id = ln.created_by) as familyName, (SELECT status_result FROM poy WHERE poy_code = ln.poy_code) as status_result, (SELECT SUM(aff_amount) FROM aff_log WHERE poy_code = ln.poy_code) as aff_amount FROM lotto_number ln WHERE date_lotto >= ? AND date_lotto <= ? AND status = ? GROUP BY poy_code ORDER BY created_at DESC`;
        // var sql = `SELECT p.poy_code, p.created_at, p.status as status_poy, p.lotto_type_id, p.status_result, p.total, p.discount as sum_discount, p.price as sum_total, p.note, lt.lotto_type_name, mb.name, mb.familyName, SUM(pl.total) as sum_prize FROM poy as p LEFT JOIN lotto_type as lt ON p.lotto_type_id = lt.lotto_type_id LEFT JOIN member as mb ON p.created_by = mb.id LEFT JOIN prize_log as pl ON p.poy_code = pl.poy_code JOIN lotto_number as ln ON p.poy_code = ln.poy_code WHERE p.date_lotto >= ? AND p.date_lotto <= ? AND ln.status = ? GROUP BY p.poy_code ORDER BY lt.closing_time DESC`;
        var sql = `SELECT p.poy_code, MAX(p.created_at) AS created_at, p.status AS status_poy, p.lotto_type_id, p.status_result, p.total, p.discount AS sum_discount, p.price AS sum_total, p.note, MAX(lt.lotto_type_name) AS lotto_type_name, MAX(mb.name) AS name, MAX(mb.familyName) AS familyName, SUM(pl.total) AS sum_prize FROM poy AS p LEFT JOIN lotto_type AS lt ON p.lotto_type_id = lt.lotto_type_id LEFT JOIN member AS mb ON p.created_by = mb.id LEFT JOIN prize_log AS pl ON p.poy_code = pl.poy_code WHERE p.date_lotto >= ? AND p.date_lotto <= ? GROUP BY p.poy_code, p.status, p.lotto_type_id, p.status_result, p.total, p.discount, p.price, p.note  ORDER BY MAX(lt.closing_time) DESC;`;
        connection.query(
          sql,
          [startDate, endDate, status],
          (error, result, fields) => {
            if (result === undefined) {
              return res.status(400).send({ status: false });
            } else {
              // const data = paginatedResults(req, res, result);
              const total = result.filter((el) => {
                if (el.sum_prize) {
                  return el;
                }
              });
              return res.status(200).send({ status: true, data: total });
            }
          }
        );
      } else {
        console.log("3");
        if (startDate != null && endDate != null) {
          // var sql = `SELECT poy_code, created_at, status_poy, status, lotto_type_id, (SELECT lotto_type_name FROM lotto_type WHERE lotto_type_id = ln.lotto_type_id) as lotto_type_name, (SELECT SUM(price * pay) FROM lotto_number WHERE poy_code = ln.poy_code AND status = 'suc') as sum_prize, (SELECT SUM(total) FROM lotto_number WHERE poy_code = ln.poy_code AND status != 'close') as sum_total, (SELECT SUM(discount) FROM lotto_number WHERE poy_code = ln.poy_code AND status != 'close') as sum_discount, (SELECT note FROM poy WHERE poy_code = ln.poy_code) as note, (SELECT name FROM member WHERE id = ln.created_by) as name, (SELECT familyName FROM member WHERE id = ln.created_by) as familyName, (SELECT status_result FROM poy WHERE poy_code = ln.poy_code) as status_result, (SELECT SUM(aff_amount) FROM aff_log WHERE poy_code = ln.poy_code) as aff_amount FROM lotto_number ln WHERE date_lotto >= ? AND date_lotto <= ? GROUP BY poy_code ORDER BY created_at DESC`;
          var sql = `SELECT p.poy_code, MAX(p.created_at) AS created_at, MAX(p.status) AS status_poy, MAX(p.lotto_type_id) AS lotto_type_id, MAX(p.status_result) AS status_result, MAX(p.total) AS total, MAX(p.discount) AS sum_discount, MAX(p.price) AS sum_total, MAX(p.note) AS note, MAX(lt.lotto_type_name) AS lotto_type_name, MAX(mb.name) AS name, MAX(mb.familyName) AS familyName, (SELECT SUM(total * pay) FROM lotto_number WHERE status = 'suc' AND installment_date BETWEEN '${startDate}' AND '${endDate}' AND poy_code = p.poy_code) AS sum_prize FROM poy AS p LEFT JOIN lotto_type AS lt ON p.lotto_type_id = lt.lotto_type_id LEFT JOIN member AS mb ON p.created_by = mb.id WHERE p.date_lotto BETWEEN '${startDate}' AND '${endDate}' GROUP BY p.poy_code ORDER BY MAX(lt.closing_time) DESC;`;
          connection.query(
            sql,
            [startDate, endDate],
            (error, result, fields) => {
              if (result === undefined) {
                return res.status(400).send({ status: false, msg: error });
              } else {
                // const data = paginatedResults(req, res, result);
                return res.status(200).send({ status: true, data: result });
              }
            }
          );
        } else {
          return res
            .status(400)
            .send({ status: false, msg: "กรุณาส่ง startDate, endDate" });
        }
      }
      // var sql = `SELECT lt.*, p.* FROM lotto_type as lt JOIN poy as p ON lt.lotto_type_id = p.lotto_type_id`;
      // connection.query(sql, [date], (error, result, fields) => {
      //
      //   if (result === undefined) {
      //     return res.status(400).send({ status: false });
      //   } else {
      //     const data = paginatedResults(req, res, result);
      //     return res.status(200).send({ status: true, data });
      //   }
      // });
      // } else {
      //   return res
      //     .status(400)
      //     .send({ status: false, msg: "กรุณาส่ง page, perPage" });
      // }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/detail-prize-result", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const billCode = req.query.billCode;
      // last query
      //SELECT * FROM Table ORDER BY ID DESC LIMIT 1
      // if (page != null && perPage != null) {
      // var d = moment(new Date()).format("YYYY-MM-DD");
      if (billCode != undefined) {
        var sql = `SELECT * FROM lotto_number WHERE poy_code = ?`;
        connection.query(sql, [billCode], (error, result, fields) => {
          if (result === undefined) {
            return res.status(400).send({ status: false });
          } else {
            // const data = paginatedResults(req, res, result);
            return res.status(200).send({ status: true, data: result });
          }
        });
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง billCode" });
      }
      // } else {
      //   return res
      //     .status(400)
      //     .send({ status: false, msg: "กรุณาส่ง page, perPage" });
      // }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.post("/add-prize", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   var d = moment(new Date()).format("YYYY-MM-DD");
      var prize3top = req.body.prize3top;
      var prize2bottom = req.body.prize2bottom;
      var lotto_type_id = req.body.lotto_type_id;
      var type3top = req.body.type3top;
      var type2bottom = req.body.type2bottom;
      var installment = req.body.installment;
      var prize6digit = req.body.prize6digit;
      if (
        prize3top != "" &&
        prize2bottom != "" &&
        lotto_type_id != "" &&
        type3top != "" &&
        type2bottom != "" &&
        installment != ""
      ) {
        if (!isNaN(prize3top) && !isNaN(prize2bottom)) {
          var sql = "SELECT * FROM lotto_type WHERE lotto_type_id = ?";
          connection.query(
            sql,
            [lotto_type_id],
            (error, resultTypeLotto, fields) => {
              if (resultTypeLotto.length > 0) {
                // var date = moment(resultTypeLotto[0].closing_time).format(
                //   "YYYY-MM-DD"
                // );
                var sql =
                  "SELECT * FROM prize WHERE lotto_type_id = ? AND prize_time LIKE '%' ? '%'";
                connection.query(
                  sql,
                  [lotto_type_id, installment],
                  (error, resultPrizeToday, fields) => {
                    if (resultPrizeToday == "") {
                      var sql =
                        "INSERT INTO prize (lotto_type_id, prize6digit, type3top, prize3top, type2bottom, prize2bottom, prize_time, created_by) VALUES(?, ?, ?, ?, ?, ?, ?, ?)";
                      connection.query(
                        sql,
                        [
                          lotto_type_id,
                          prize6digit,
                          type3top,
                          prize3top,
                          type2bottom,
                          prize2bottom,
                          installment,
                          data.user.id,
                        ],
                        (error, result, fields) => {
                          return res
                            .status(200)
                            .send({ status: false, msg: "เพิ่มผลหวยสำเร็จ" });
                        }
                      );
                    } else {
                      return res
                        .status(400)
                        .send({ status: false, msg: "หวยนี้ออกผลแล้ว" });
                    }
                  }
                );
              } else {
                return res
                  .status(400)
                  .send({ status: false, msg: "ไม่พบประเภทหวยนี้" });
              }
            }
          );
        } else {
          return res.status(400).send({
            status: false,
            msg: "กรุณากรอกผลรางวัลเป็นตัวเลข",
          });
        }
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณากรอกข้อมูลให้ครบ" });
      }
    } else {
      return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.put("/ban-user", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, user) => {
    if (!err) {
      //   var d = moment(new Date()).format("YYYY-MM-DD");
      var id = req.body.id;
      if (id != null) {
        var sql = "SELECT * FROM member WHERE id = ?";
        connection.query(sql, [id], (error, resultMember, fields) => {
          if (resultMember != "") {
            let status = 0;
            if (resultMember[0].is_active == 1) {
              status = 0;
            } else {
              status = 1;
            }
            var sql = "UPDATE member SET is_active = ? WHERE id = ?";
            connection.query(sql, [status, id], (error, result, fields) => {
              return res
                .status(200)
                .send({ status: true, msg: "อัพเดทสถานะผู้ใช้งานสำเร็จ" });
            });
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
      return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

module.exports = router;
