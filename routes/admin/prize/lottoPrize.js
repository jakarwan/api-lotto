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
  jwt.verify(req.token, "secretkey", (err, user) => {
    if (!err) {
      const {
        search,
        lotto_type_id,
        startDate,
        endDate,
        status, // ใช้สำหรับ HAVING sum_prize > 0
        page,
        perPage,
      } = req.query;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง startDate, endDate" });
      }

      let sql = `
        SELECT 
            p.poy_code, 
            p.created_at, 
            p.status AS status_poy, 
            p.lotto_type_id, 
            p.status_result, 
            p.total, 
            p.discount AS sum_discount, 
            p.price AS sum_total, 
            p.note, 
            lt.lotto_type_name, 
            mb.name, 
            mb.familyName, 
            COALESCE(SUM(ln.total * ln.pay), null) AS sum_prize
        FROM poy AS p
        LEFT JOIN lotto_type AS lt ON p.lotto_type_id = lt.lotto_type_id
        LEFT JOIN member AS mb ON p.created_by = mb.id
        LEFT JOIN lotto_number AS ln 
            ON p.poy_code = ln.poy_code 
            AND ln.status = 'suc' 
            AND ln.date_lotto >= ? 
            AND ln.date_lotto < DATE_ADD(?, INTERVAL 1 DAY)
        WHERE p.date_lotto >= ? 
          AND p.date_lotto < DATE_ADD(?, INTERVAL 1 DAY)
      `;

      const params = [startDate, endDate, startDate, endDate];

      if (lotto_type_id) {
        sql += " AND p.lotto_type_id = ? ";
        params.push(lotto_type_id);
      }

      if (status === "0" || status === "1") {
        sql += " AND p.status_result = ? ";
        params.push(status);
      }

      if (search) {
        sql +=
          " AND (mb.name LIKE CONCAT('%', ?, '%') OR p.poy_code LIKE CONCAT('%', ?, '%') OR mb.phone LIKE CONCAT('%', ?, '%')) ";
        params.push(search, search, search);
      }

      sql += `
        GROUP BY 
            p.poy_code, 
            p.created_at, 
            p.status, 
            p.lotto_type_id, 
            p.status_result, 
            p.total, 
            p.discount, 
            p.price, 
            p.note, 
            lt.lotto_type_name, 
            mb.name, 
            mb.familyName
      `;

      if (status === "1") {
        sql += " HAVING sum_prize > 0 ";
      }

      sql += ` ORDER BY p.created_at DESC`;

      connection.query(sql, params, (error, result) => {
        if (error) {
          console.error("SQL Error:", error);
          return res
            .status(500)
            .send({ status: false, msg: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
        }

        const data = paginatedResults(req, res, result);
        return res.status(200).send({ status: true, data: user.user.id !== 1131 ? data: [] });
      });
    } else {
      return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/turnover", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const {
        search,
        lotto_type_id,
        startDate,
        endDate
      } = req.query;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง startDate, endDate" });
      }

      let sql = `
        SELECT 
          SUM(p.total) AS turnover,
          SUM(CASE WHEN p.status_result = 0 THEN p.total ELSE 0 END) AS outstanding
        FROM poy AS p
        LEFT JOIN member AS mb ON p.created_by = mb.id
        WHERE p.date_lotto >= ? 
          AND p.date_lotto < DATE_ADD(?, INTERVAL 1 DAY)
      `;

      const params = [startDate, endDate];

      if (search) {
        sql += `
          AND (
            mb.name LIKE CONCAT('%', ?, '%') 
            OR p.poy_code LIKE CONCAT('%', ?, '%') 
            OR mb.phone LIKE CONCAT('%', ?, '%')
          )
        `;
        params.push(search, search, search);
      }

      if (lotto_type_id) {
        sql += " AND p.lotto_type_id = ? ";
        params.push(lotto_type_id);
      }

      connection.query(sql, params, (error, result) => {
        if (error) {
          console.error("SQL Error:", error);
          return res
            .status(500)
            .send({ status: false, msg: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
        }

        return res.status(200).send({
          status: true,
          data: {
            turnover: parseFloat(result[0].turnover || 0),
            outstanding: parseFloat(result[0].outstanding || 0),
          },
        });
      });
    } else {
      return res
        .status(403)
        .send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
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
      var prize3bottom = JSON.stringify(req.body.prize3bottom);
      if (
        prize3top != "" &&
        prize2bottom != "" &&
        lotto_type_id != "" &&
        type3top != "" &&
        type2bottom != "" &&
        installment != ""
      ) {
        if (!isNaN(prize3top) && !isNaN(prize2bottom) && !isNaN(prize6digit)) {
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
                      var sql = `SELECT * FROM lotto_type WHERE lotto_type_id = ? AND closing_time <= NOW();`;
                      connection.query(
                        sql,
                        [lotto_type_id],
                        (error, resultChkPrizeTime, fields) => {
                          if (resultChkPrizeTime.length > 0) {
                            var sql =
                              "INSERT INTO prize (lotto_type_id, prize6digit, prize3bottom, type3top, prize3top, type2bottom, prize2bottom, prize_time, created_by) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)";
                            connection.query(
                              sql,
                              [
                                lotto_type_id,
                                prize6digit,
                                prize3bottom,
                                type3top,
                                prize3top,
                                type2bottom,
                                prize2bottom,
                                installment,
                                data.user.id,
                              ],
                              (error, result, fields) => {
                                if (error) return console.log(error);
                                return res.status(200).send({
                                  status: false,
                                  msg: "เพิ่มผลหวยสำเร็จ",
                                });
                              }
                            );
                          } else {
                            return res.status(400).send({
                              status: false,
                              msg: "หวยนี้ยังไม่ถึงเวลาออกผล",
                            });
                          }
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
