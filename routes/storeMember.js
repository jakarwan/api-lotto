const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");

router.post("/register-store", verifyToken, (req, res) => {
  //   var username = req.body.username;
  //   var name = req.body.name;
  //   var phone = req.body.phone;
  //   bcrypt.hash(password, 10)
  var phone = req.body.phone;
  var password = req.body.password;
  var name = req.body.name;
  var familyName = req.body.familyName;
  var address = req.body.address;
  if (!phone || !password || !name || !familyName || !address) {
    return res.status(400).send({ msg: "กรุณากรอกข้อมูลให้ครบ" });
  } else {
    connection.query(
      `SELECT * FROM member where is_active = 1 AND phone = ${phone}`,
      (error, result, fields) => {
        if (result === undefined || result.length == 0) {
          connection.query(
            `INSERT INTO member (phone, password, name, familyName, address) VALUES(?, ?, ? ,? ,?)`,
            [phone, encryptedPassword, name, familyName, address],
            (error, result, fields) => {
              return res
                .status(200)
                .send({ status: "success", msg: "สมัครสมาชิกสำเร็จ !" });
            }
          );
        } else {
          return res.status(400).send({
            status: "error",
            msg: "หมายเลขโทรศัพท์นี้ถูกใช้งานแล้ว",
          });
        }
      }
    );
  }
});

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (err) {
      res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
    } else {
      if (req.query.page && req.query.perPage) {
        // const phone = req.query.phone;
        const page = req.query.page;
        const perPage = req.query.perPage;
        var sql = "SELECT * FROM store";
        connection.query(sql, [page, perPage], (error, result, fields) => {
          if (result === undefined) {
            return res.status(400).send({ status: "error" });
          } else {
            const data = paginatedResults(req, res, result);
            return res.status(200).send(data);
          }
        });
      } else {
        return res
          .status(400)
          .send({ status: "error", msg: "กรุณาส่ง page, perPage" });
      }
    }
  });
});

router.get("/menu", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (err) {
      res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
    } else {
      if (req.query.page && req.query.perPage) {
        // const phone = req.query.phone;
        // const page = req.query.page;
        // const perPage = req.query.perPage;
        if (req.query.codeStore != null) {
          const codeStore = req.query.codeStore;
          var sql = "SELECT * FROM menu WHERE code_store = ?";
          connection.query(sql, [codeStore], (error, result, fields) => {
            if (result.length < 1) {
              return res
                .status(400)
                .send({ status: "error", msg: "ไม่มีรายการสินค้า" });
            } else {
              var sqlStore = "SELECT * FROM store WHERE code_store = ?";
              connection.query(
                sqlStore,
                [codeStore],
                (error, resultStore, fields) => {
                  if (resultStore != "") {
                    if (req.query.name != null) {
                      const name = req.query.name;
                      var sql = `SELECT * FROM menu WHERE menu_name LIKE '%' ? '%' AND code_store = ?`;
                      connection.query(
                        sql,
                        [name, codeStore],
                        (error, resultSearch, fields) => {
                          const data = paginatedResults(req, res, resultSearch);
                          return res
                            .status(200)
                            .send({ data: data, store: resultStore[0] });
                        }
                      );
                    } else {
                      const data = paginatedResults(req, res, result);
                      return res
                        .status(200)
                        .send({ data: data, store: resultStore[0] });
                    }
                  }
                }
              );
            }
          });
        } else {
          return res.status(400).send({ status: "error", msg: "ไม่พบร้านค้า" });
        }
      } else {
        return res
          .status(400)
          .send({ status: "error", msg: "กรุณาส่ง page, perPage" });
      }
    }
  });
});

router.post("/menu/add-order", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      // var msg = req.body.msg;
      var userId = jwt.verify(req.token, "secretkey");
      if (req.body.codeStore != null && req.body.menuId != null) {
        var codeStore = req.body.codeStore;
        var menuId = req.body.menuId;
        connection.query(
          "SELECT * FROM order_store WHERE user_id = ? AND status = ? AND code_store = ?",
          [userId.user.id, "WAIT", codeStore],
          (error, result, fields) => {
            if (result.length > 0) {
              connection.query(
                "INSERT INTO order_store (code_store, menu_id, user_id, bill_code) VALUES(?, ?, ?, ?)",
                [codeStore, menuId, userId.user.id, result[0].bill_code],
                (error, resultInsert, fields) => {
                  connection.query(
                    "SELECT os.*, mn.menu_price FROM order_store as os JOIN menu as mn ON os.menu_id = mn.menu_id WHERE os.bill_code = ? AND os.status = ?",
                    [result[0].bill_code, "WAIT"],
                    (error, resultOrder, fields) => {
                      var totalPrice = 0;
                      resultOrder.forEach((item) => {
                        totalPrice += item.menu_price * item.qty;
                      });
                      connection.query(
                        "UPDATE bill SET total_price = ? WHERE bill_code = ?",
                        [totalPrice, result[0].bill_code],
                        (error, resultUpdate, fields) => {
                          return res.status(200).send({ status: "success" });
                        }
                      );
                    }
                  );
                }
              );
            } else {
              connection.query(
                `SELECT MAX(bill_id) as id FROM bill`,
                (error, resultMax, fields) => {
                  var maxId = resultMax[0].id ?? 0;
                  connection.query(
                    "INSERT INTO bill (bill_code, code_store, user_id) VALUES(?, ?, ?)",
                    [`BILL000${maxId + 1}`, codeStore, userId.user.id],
                    (error, resultInsertBill, fields) => {
                      connection.query(
                        "INSERT INTO order_store (code_store, menu_id, user_id, bill_code) VALUES(?, ?, ?, ?)",
                        [
                          codeStore,
                          menuId,
                          userId.user.id,
                          `BILL000${maxId + 1}`,
                        ],
                        (error, resultInsertOrder, fields) => {
                          connection.query(
                            "SELECT os.*, mn.menu_price FROM order_store as os JOIN menu as mn ON os.menu_id = mn.menu_id WHERE os.bill_code = ? AND os.status = ?",
                            [`BILL000${maxId + 1}`, "WAIT"],
                            (error, resultOrder, fields) => {
                              var totalPrice = 0;
                              resultOrder.forEach((item) => {
                                totalPrice += item.menu_price * item.qty;
                              });
                              connection.query(
                                "UPDATE bill SET total_price = ? WHERE bill_code = ?",
                                [totalPrice, `BILL000${maxId + 1}`],
                                (error, resultUpdate, fields) => {
                                  connection.query(
                                    "SELECT * FROM order_store WHERE bill_code = ? AND status = ?",
                                    [`BILL000${maxId + 1}`, "WAIT"],
                                    (error, result, fields) => {}
                                  );
                                  return res
                                    .status(200)
                                    .send({ status: "success" });
                                }
                              );
                            }
                          );
                        }
                      );
                      // return res.status(200).send({ status: "success" });
                    }
                  );
                }
              );
              // return res
              //   .status(400)
              //   .send({ status: "error", msg: "ไม่พบร้านค้า" });
            }
          }
        );
      } else {
        return res
          .status(400)
          .send({ status: "error", msg: "กรุณาส่ง codeStore" });
      }
    } else {
      res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/menu/cart-store", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      // const phone = req.query.phone;
      var userId = jwt.verify(req.token, "secretkey");
      var sql =
        "SELECT b.*, s.store_name, s.store_profile FROM bill as b JOIN store as s ON b.code_store = s.code_store WHERE b.user_id = ?"; //  AND b.status = ?
      connection.query(sql, [userId.user.id], (error, result, fields) => {
        if (result != "") {
          // const data = paginatedResults(req, res, result);
          return res.status(200).send({ data: result });
        } else {
          return res.status(400).send({ status: "success" });
        }
      });
    } else {
      res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/menu/cart", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      // const phone = req.query.phone;
      if (req.query.codeStore != null && req.query.billCode) {
        var codeStore = req.query.codeStore;
        var billCode = req.query.billCode;
        var sqlStore = "SELECT * FROM store WHERE code_store = ?";
        connection.query(
          sqlStore,
          [codeStore],
          (error, resultStore, fields) => {
            if (resultStore != "") {
              var userId = jwt.verify(req.token, "secretkey");
              var sql =
                "SELECT os.*, mn.menu_name, mn.menu_price, mn.menu_img FROM order_store as os JOIN menu as mn ON os.menu_id = mn.menu_id WHERE os.user_id = ? AND os.code_store = ? AND os.bill_code = ?"; // AND os.status = ?
              connection.query(
                sql,
                [userId.user.id, codeStore, billCode],
                (error, result, fields) => {
                  var sqlBill = "SELECT * FROM bill WHERE bill_code = ?";
                  connection.query(
                    sqlBill,
                    [billCode],
                    (error, resultBill, fields) => {
                      return res.status(200).send({
                        data: result,
                        store: resultStore[0],
                        bill: resultBill[0],
                      });
                    }
                  );
                }
              );
            } else {
              return res
                .status(400)
                .send({ status: "error", msg: "ไม่พบร้านค้า" });
            }
          }
        );
        // const data = paginatedResults(req, res, result);
      } else {
        res
          .status(400)
          .send({ status: "error", msg: "กรุณาส่ง codeStore, billCode" });
      }
    } else {
      res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.put("/menu/cart-update", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      var qty = req.body.qty;
      var menuId = req.body.menuId;
      var billCode = req.body.billCode;
      var userId = jwt.verify(req.token, "secretkey");
      if (qty != undefined && menuId != undefined) {
        var sql =
          "UPDATE order_store SET qty = ? WHERE order_id = ? AND user_id = ?";
        connection.query(
          sql,
          [qty, menuId, userId.user.id],
          (error, result, fields) => {
            connection.query(
              "SELECT os.*, mn.menu_price FROM order_store as os JOIN menu as mn ON os.menu_id = mn.menu_id WHERE os.bill_code = ? AND os.status = ?",
              [billCode, "WAIT"],
              (error, resultOrder, fields) => {
                var totalPrice = 0;
                resultOrder.forEach((item) => {
                  totalPrice += item.menu_price * item.qty;
                });
                connection.query(
                  "UPDATE bill SET total_price = ? WHERE bill_code = ?",
                  [totalPrice, billCode],
                  (error, resultUpdate, fields) => {
                    return res.status(200).send({
                      status: "success",
                      msg: "อัพเดทรายการสำเร็จ",
                    });
                  }
                );
              }
            );
          }
        );
      } else {
        return res
          .status(400)
          .send({ status: "error", msg: "กรุณาส่ง qty, menuId" });
      }
    } else {
      res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.delete("/menu/cart-delete", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      var qty = req.body.qty;
      var menuId = req.body.menuId;
      var codeStore = req.body.codeStore;
      var userId = jwt.verify(req.token, "secretkey");
      if (menuId != undefined) {
        connection.query(
          "SELECT * FROM order_store WHERE order_id = ?",
          [menuId],
          (error, resultOrderStore, fields) => {
            var sql =
              "DELETE FROM order_store WHERE order_id = ? AND user_id = ?";
            connection.query(
              sql,
              [menuId, userId.user.id],
              (error, result, fields) => {
                connection.query(
                  "SELECT os.*, mn.menu_price FROM order_store as os JOIN menu as mn ON os.menu_id = mn.menu_id WHERE os.bill_code = ? AND os.status = ?",
                  [resultOrderStore[0].bill_code, "WAIT"],
                  (error, resultOrder, fields) => {
                    if (resultOrder != "") {
                      var totalPrice = 0;
                      resultOrder.forEach((item) => {
                        totalPrice += item.menu_price * item.qty;
                      });
                      connection.query(
                        "UPDATE bill SET total_price = ? WHERE bill_code = ?",
                        [totalPrice, resultOrderStore[0].bill_code],
                        (error, resultUpdate, fields) => {
                          return res.status(200).send({
                            status: "success",
                            msg: "ลบรายการสำเร็จ",
                          });
                        }
                      );
                    } else {
                      var sql = "DELETE FROM BILL WHERE bill_code = ?";
                      connection.query(
                        sql,
                        [resultOrderStore[0].bill_code],
                        (error, result, fields) => {
                          return res.status(200).send({
                            status: "success",
                            msg: "อัพเดทรายการสำเร็จ",
                          });
                        }
                      );
                    }
                  }
                );
              }
            );
          }
        );
      } else {
        return res
          .status(400)
          .send({ status: "error", msg: "กรุณาส่ง qty, menuId" });
      }
    } else {
      res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.delete("/menu/bill-delete", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      var billCode = req.body.billCode;
      var userId = jwt.verify(req.token, "secretkey");
      if (billCode != undefined) {
        var sql = "DELETE FROM bill WHERE bill_code = ? AND user_id = ?";
        connection.query(
          sql,
          [billCode, userId.user.id],
          (error, result, fields) => {
            var sql =
              "DELETE FROM order_store WHERE bill_code = ? AND user_id = ? AND status = ?";
            connection.query(
              sql,
              [billCode, userId.user.id, "WAIT"],
              (error, result, fields) => {
                return res.status(200).send({
                  status: "success",
                  msg: "ลบรายการในตะกร้าสำเร็จ",
                });
              }
            );
          }
        );
      } else {
        return res
          .status(400)
          .send({ status: "error", msg: "กรุณาส่ง qty, menuId" });
      }
    } else {
      res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.put("/menu/update-status-payment", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      // var msg = req.body.msg;
      var userId = jwt.verify(req.token, "secretkey");
      if (req.body.status != null && req.body.billCode != null) {
        var status = req.body.status;
        var billCode = req.body.billCode;
        // connection.query(
        //   `SELECT * FROM order_store WHERE status = ? AND bill_code = ?`,
        //   ["WAIT", billCode],
        //   (error, result, fields) => {
        //
        connection.query(
          `UPDATE bill SET status = ? WHERE bill_code = ?`,
          [status, billCode],
          (error, resultBill, fields) => {
            connection.query(
              `UPDATE order_store SET status = ? WHERE bill_code = ?`,
              [status, billCode],
              (error, result, fields) => {
                return res.status(200).send({
                  status: "success",
                  msg: "อัพเดทสถานะสำเร็จ",
                });
              }
            );
          }
        );
        //   }
        // );
      } else {
        return res
          .status(400)
          .send({ status: "error", msg: "กรุณาส่ง codeStore, billCode" });
      }
    } else {
      res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});
module.exports = router;
