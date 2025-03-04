const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../../routes/verifyToken");
const paginatedResults = require("../../routes/pagination");
const moment = require("moment");

router.get("/dashboard", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      var d = moment(new Date()).format("YYYY-MM-DD");
      let total = 0;
      let totalToday = 0;
      let depositeTotal = 0;
      let depositeTotalToday = 0;
      let withdrawTotal = 0;
      let withdrawTotalToday = 0;
      /////////// query count poy ////////////
      var sql = "SELECT COUNT(*) as total_bill FROM poy";
      connection.query(sql, (error, resultCount, fields) => {
        /////////// query count poy today ////////////
        var sql =
          "SELECT COUNT(*) as total_bill_today FROM poy WHERE created_at LIKE '%' ? '%'";
        connection.query(sql, [d], (error, resultCountToday, fields) => {
          /////////// query total poy ////////////
          var sql = "SELECT total FROM poy";
          connection.query(sql, (error, resultPoyTotal, fields) => {
            /////////// query total poy to date now  ////////////
            var sql = "SELECT total FROM poy WHERE created_at LIKE '%' ? '%'";
            connection.query(sql, [d], (error, resultPoyTotalToday, fields) => {
              /////////// query total member  ////////////
              var sql = "SELECT COUNT(*) as count_member FROM member";
              connection.query(sql, (error, resultMember, fields) => {
                /////////// query total member new  ////////////
                var sql =
                  "SELECT COUNT(*) as member_today FROM member WHERE created_at LIKE '%' ? '%'";
                connection.query(
                  sql,
                  [d],
                  (error, resultMemberToday, fields) => {
                    /////////// query total deposite ////////////
                    var sql =
                      "SELECT * FROM deposite WHERE type_dp = ? OR type_dp = ? OR type = ?";
                    connection.query(
                      sql,
                      ["AUTO", "PP", "เติมเครดิตแมนนวล"],
                      (error, resultDpTotal, fields) => {
                        resultDpTotal.forEach((item) => {
                          depositeTotal += item.amount;
                        });

                        /////////// query total deposite to date now  ////////////
                        var sql =
                          "SELECT * FROM deposite WHERE type_dp = ? AND type_dp = ? OR type = ? OR created_at LIKE '%' ? '%'";
                        connection.query(
                          sql,
                          ["AUTO", "PP", "เติมเครดิตแมนนวล", d],
                          (error, resultDpTotalToday, fields) => {
                            /////////// query total withdraw  ////////////
                            var sql =
                              "SELECT * FROM withdraw WHERE type_wd = ? AND status = 1";
                            connection.query(
                              sql,
                              ["WD"],
                              (error, resultWdTotal, fields) => {
                                resultWdTotal.forEach((item) => {
                                  withdrawTotal += item.amount;
                                });

                                /////////// query total deposite to date now  ////////////
                                var sql =
                                  "SELECT * FROM withdraw WHERE type_wd = ? AND status = 1 AND created_at LIKE '%' ? '%'";
                                connection.query(
                                  sql,
                                  ["WD", d],
                                  (error, resultWdTotalToday, fields) => {
                                    var sql =
                                      "SELECT SUM(credit_balance) as total FROM member";
                                    connection.query(
                                      sql,
                                      (error, resultTotalMember, fields) => {
                                        resultWdTotalToday.forEach(
                                          (element) => {
                                            withdrawTotalToday +=
                                              element.amount;
                                          }
                                        );
                                        resultPoyTotal.forEach((item) => {
                                          total += item.total;
                                        });
                                        resultPoyTotalToday.forEach((el) => {
                                          totalToday += el.total;
                                        });
                                        const data = {
                                          totalPrice: total.toFixed(2),
                                          totalToday: totalToday.toFixed(2),
                                          count: resultCount[0].total_bill,
                                          countToday:
                                            resultCountToday[0]
                                              .total_bill_today,
                                          member: resultMember[0].count_member,
                                          memberNews:
                                            resultMemberToday[0].member_today,
                                          depositeTotal:
                                            depositeTotal.toFixed(2),
                                          depositeTotalToday:
                                            depositeTotalToday.toFixed(2),
                                          withdrawTotal:
                                            withdrawTotal.toFixed(2),
                                          withdrawTotalToday:
                                            withdrawTotalToday.toFixed(2),
                                          totalCreditMember:
                                            resultTotalMember[0].total.toFixed(
                                              2
                                            ),
                                        };
                                        //   const data = paginatedResults(req, res, result);
                                        return res
                                          .status(200)
                                          .send({ status: true, data: data });
                                      }
                                    );
                                  }
                                );
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              });
            });
          });
        });
      });
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

module.exports = router;
