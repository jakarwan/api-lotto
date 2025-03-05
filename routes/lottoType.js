const express = require("express");
const morgan = require("morgan");
const router = express.Router();
const app = express();
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const verifyToken = require("../routes/verifyToken");
const jwt = require("jsonwebtoken");
const connection = require("../config/connection");
const paginatedResults = require("../routes/pagination");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// const storage = multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, "./uploads");
//   },
//   filename: function (req, file, callback) {
//     callback(null, new Date().toISOString() + file.originalname);
//   },
// });
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const fileFilter = (req, file, callback) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

// const upload = multer({ dist: "http://localhost:3000/" });
// var upload = multer({ dest: 'upload/'});
// const upload = multer({ storage: storage, fileFilter: fileFilter });
const upload = multer({ storage: storage, fileFilter: fileFilter });

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      //   const page = req.query.page;
      //   const perPage = req.query.perPage;
      const typeId = req.query.typeId;
      var sql = "";
      if (typeId != null) {
        sql =
          "SELECT lt.*, t.type FROM lotto_type as lt JOIN type as t ON lt.type_id = t.type_id WHERE lt.type_id = ? AND lt.active = 1 ORDER BY lt.closing_time ASC";
      } else {
        sql =
          "SELECT lt.*, t.type FROM lotto_type as lt JOIN type as t ON lt.type_id = t.type_id WHERE lt.active = 1 ORDER BY lt.closing_time ASC";
      }
      connection.query(sql, [typeId], (error, result, fields) => {
        if (result === undefined) {
          return res.status(400).send({ status: false });
        } else {
          //   const data = paginatedResults(req, res, result);
          return res.status(200).send({ status: true, data: result });
        }
      });

      //   } else {
      //   return res
      //     .status(400)
      //     .send({ status: "error", msg: "กรุณาส่ง page, perPage" });
      //   }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/all", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const typeId = req.query.typeId;
      var sql = "";
      if (typeId != null) {
        sql =
          "SELECT lt.*, t.type FROM lotto_type as lt JOIN type as t ON lt.type_id = t.type_id WHERE lt.type_id = ? ORDER BY lt.closing_time DESC";
      } else {
        sql =
          "SELECT lt.*, t.type FROM lotto_type as lt JOIN type as t ON lt.type_id = t.type_id ORDER BY lt.closing_time DESC";
      }
      connection.query(sql, [typeId], (error, result, fields) => {
        if (result === undefined) {
          return res.status(400).send({ status: false });
        } else {
          //   const data = paginatedResults(req, res, result);
          return res.status(200).send({ status: true, data: result });
        }
      });
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/all/active-type", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const lotto_type_id = req.query.lotto_type_id;
      if (lotto_type_id != null) {
        var sql = "SELECT * FROM lotto_type WHERE lotto_type_id = ?";
        connection.query(sql, [lotto_type_id], (error, resultType, fields) => {
          if (resultType != "") {
            let status = 0;
            if (resultType[0].active == 1) {
              status = 0;
            } else {
              status = 1;
            }
            var sql =
              "UPDATE lotto_type SET active = ? WHERE lotto_type_id = ?";
            connection.query(
              sql,
              [status, lotto_type_id],
              (error, result, fields) => {
                return res
                  .status(200)
                  .send({ status: true, msg: "อัพเดทสถานะประเภทหวยสำเร็จ" });
              }
            );
          } else {
            return res
              .status(400)
              .send({ status: false, msg: "ไม่พบประเภทหวยนี้ในระบบ" });
          }
        });
      } else {
        return res.status(400).send({ status: false, msg: "กรุณาส่ง id" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/edit", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const lotto_type_id = req.query.lotto_type_id;
      var sql = "";
      if (lotto_type_id != null) {
        sql = "SELECT * FROM lotto_type WHERE lotto_type_id = ?";
        connection.query(sql, [lotto_type_id], (error, result, fields) => {
          if (result === undefined) {
            return res.status(400).send({ status: false });
          } else {
            sql =
              "SELECT c_day FROM close_lotto WHERE lotto_type_id = ? AND active = 1";
            connection.query(
              sql,
              [lotto_type_id],
              (error, resultClose, fields) => {
                const array = [];
                resultClose.filter((el) => {
                  array.push(el.c_day);
                });
                // console.log(array);
                return res
                  .status(200)
                  .send({ status: true, data: result[0], close: array });
              }
            );
            //   const data = paginatedResults(req, res, result);
          }
        });
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง lotto_type_id" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.post("/edit-close-date", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const lotto_type_id = req.body.lotto_type_id;
      const close_date = req.body.close_date;
      var sql = "";
      if (lotto_type_id != null && close_date != null) {
        sql = "SELECT * FROM lotto_type WHERE lotto_type_id = ?";
        connection.query(sql, [lotto_type_id], (error, result, fields) => {
          if (result === undefined) {
            return res
              .status(400)
              .send({ status: false, msg: "ไม่พบประเภทหวยนี้" });
          } else {
            close_date.forEach((item) => {
              sql =
                "SELECT c_day FROM close_lotto WHERE lotto_type_id = ? AND c_day = ?";
              connection.query(
                sql,
                [lotto_type_id, item],
                (error, resultClose, fields) => {
                  if (resultClose === undefined) {
                    sql =
                      "INSERT INTO close_lotto (c_day, lotto_type_id) VALUES(?, ?)";
                    connection.query(
                      sql,
                      [item, lotto_type_id],
                      (error, resultClose, fields) => {}
                    );
                  } else {
                    sql =
                      "DELETE FORM close_lotto WHERE lotto_type_id = ? AND c_day = ?";
                    connection.query(
                      sql,
                      [lotto_type_id, item],
                      (error, resultClose, fields) => {}
                    );
                  }
                  // const array = [];
                  // resultClose.filter((el) => {
                  //   array.push(el.c_day);
                  // });
                  // console.log(array);
                  // return res
                  //   .status(200)
                  //   .send({ status: true, data: result[0], close: array });
                }
              );
            });

            //   const data = paginatedResults(req, res, result);
          }
        });
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง lotto_type_id" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.post(
  "/add-lotto-type",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    jwt.verify(req.token, "secretkey", (err, data) => {
      if (!err) {
        // const filePath =
        //   req.protocol +
        //   "://" +
        //   host +
        //   "/" +
        //   "uploads/" +
        //   req.file.filename;
        // const host = req.hostname;
        const name = req.body.name;
        // const hostname = "api.laosviangjanvip.com";
        const reqhttps = "https";
        //   const lotto_type_img = req.file;
        const type_id = req.body.type_id;
        const closing_time = req.body.closing_time;
        if (req.body.name != null && req.file != null) {
          const { filename: image } = req.file;
          const filePath =
            reqhttps + "://" + req.get('host') + "/" + "api/images/" + image;
          // const filePath = "http://localhost:3000/uploads/" + image;
          var sql =
            "INSERT INTO lotto_type (lotto_type_name, lotto_type_img, type_id, closing_time) VALUES(?, ?, ?, ?)";
          connection.query(
            sql,
            [name, filePath, type_id, closing_time],
            (error, result, fields) => {
              return res.status(200).send({
                status: true,
                msg: "เพิ่มข้อมูลหวยสำเร็จ",
              });
            }
          );
        } else {
          return res.status(400).send({
            success: false,
            msg: "กรุณากรอกข้อมูลให้ครบ",
          });
        }

        // const name = req.body.name;
        // const lotto_type_img = req.body.lotto_type_img;
        // const type_id = req.body.type_id;
        // const closing_time = req.body.closing_time;
        // if ((name, lotto_type_img, type_id, closing_time)) {
        //   var sql =
        //     "INSERT INTO lotto_type (lotto_type_name, lotto_type_img, type_id, closing_time) VALUES(?, ?, ?, ?)";
        //   connection.query(
        //     sql,
        //     [name, lotto_type_img, type_id, closing_time],
        //     (error, result, fields) => {
        //
        //       return res
        //         .status(200)
        //         .send({ status: "success", msg: "เพิ่มหวยสำเร็จ" });
        //     }
        //   );
        // } else {
        //   return res.status(400).send({
        //     status: "error",
        //     msg: "กรุณาส่ง ชื่อหวย, รูปภาพ, ประเภท, เวลาปิด",
        //   });
        // }
      } else {
        res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
      }
    });
  }
);

router.put(
  "/edit-lotto-type",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    jwt.verify(req.token, "secretkey", (err, data) => {
      if (!err) {
        // const filePath =
        //   req.protocol +
        //   "://" +
        //   host +
        //   "/" +
        //   "uploads/" +
        //   req.file.filename;
        // const host = req.hostname;
        const name = req.body.name;
        const hostname = req.get('host');
        const reqhttps = "https";
        //   const lotto_type_img = req.file;
        const lotto_type_id = req.body.lotto_type_id;
        const closing_time = req.body.closing_time;
        const open = req.body.open;
        const colorCode = req.body.colorCode;
        var close_date = JSON.parse(req.body.close_date);

        if (
          name != null &&
          // req.file != null &&
          closing_time != null &&
          lotto_type_id != null &&
          open != null
        ) {
          // const filePath = "http://localhost:3000/uploads/" + image;
          if (req.file != null) {
            const { filename: image } = req.file;
            const filePath =
              reqhttps + "://" + hostname + "/" + "api/images/" + image;
            var sql =
              "UPDATE lotto_type SET lotto_type_name = ?, lotto_type_img = ?, closing_time = ?, open = ?, lotto_bg = ? WHERE lotto_type_id = ?";
            connection.query(
              sql,
              [name, filePath, closing_time, open, colorCode, lotto_type_id],
              (error, result, fields) => {
                return res.status(200).send({
                  status: true,
                  msg: "แก้ไขข้อมูลหวยสำเร็จ",
                });
              }
            );
          } else {
            // var active = 0;
            var sql =
              "UPDATE lotto_type SET lotto_type_name = ?, closing_time = ?, open = ?, lotto_bg = ? WHERE lotto_type_id = ?";
            connection.query(
              sql,
              [name, closing_time, open, colorCode, lotto_type_id],
              (error, result, fields) => {
                return res.status(200).send({
                  status: true,
                  msg: "แก้ไขข้อมูลหวยสำเร็จ",
                });
              }
            );
            if (close_date != null) {
              // console.log(close_date);
              close_date.forEach((item) => {
                // console.log(item);
                sql =
                  "SELECT c_day, active FROM close_lotto WHERE lotto_type_id = ? AND c_day = ?";
                connection.query(
                  sql,
                  [lotto_type_id, item],
                  (error, resultCloseDate, fields) => {
                    // console.log(resultCloseDate);
                    // if (resultCloseDate.indexOf(item) != -1) {
                    //   sql =
                    //     "UPDATE close_lotto SET active = ? WHERE lotto_type_id = ? AND c_day = ?";
                    //   connection.query(
                    //     sql,
                    //     [active, lotto_type_id, item],
                    //     (error, resultClose, fields) => {
                    //
                    //     }
                    //   );
                    //   console.log("if");
                    // } else {
                    //   console.log(resultCloseDate);
                    //   sql =
                    //     "UPDATE close_lotto SET active = 0 WHERE lotto_type_id = ?";
                    //   connection.query(
                    //     sql,
                    //     [lotto_type_id],
                    //     (error, resultClose, fields) => {
                    //
                    //       sql =
                    //         "UPDATE close_lotto SET active = 1 WHERE lotto_type_id = ? AND c_day = ?";
                    //       connection.query(
                    //         sql,
                    //         [lotto_type_id, item],
                    //         (error, resultClose, fields) => {
                    //
                    //         }
                    //       );
                    //     }
                    //   );
                    //   console.log("else");
                    // }
                    if (resultCloseDate != "") {
                      // sql =
                      //   "DELETE FORM close_lotto WHERE lotto_type_id = ? AND c_day = ?";
                      // connection.query(
                      //   sql,
                      //   [lotto_type_id, item],
                      //   (error, resultClose, fields) => {
                      //
                      //   }
                      // );
                      // sql =
                      //   "UPDATE close_lotto SET active = ? WHERE lotto_type_id = ? AND c_day = ?";
                      // connection.query(
                      //   sql,
                      //   [active, lotto_type_id, item],
                      //   (error, resultClose, fields) => {
                      //
                      //   }
                      // );
                      sql =
                        "UPDATE close_lotto SET active = 0 WHERE lotto_type_id = ?";
                      connection.query(
                        sql,
                        [lotto_type_id],
                        (error, resultClose, fields) => {
                          sql =
                            "UPDATE close_lotto SET active = 1 WHERE lotto_type_id = ? AND c_day = ?";
                          connection.query(
                            sql,
                            [lotto_type_id, item],
                            (error, resultClose, fields) => {}
                          );
                        }
                      );
                    } else {
                      // sql =
                      //   "UPDATE close_lotto SET active = ? WHERE lotto_type_id = ?";
                      // connection.query(
                      //   sql,
                      //   [1, lotto_type_id, item],
                      //   (error, resultClose, fields) => {
                      //
                      //   }
                      // );
                      sqlInsert =
                        "INSERT INTO close_lotto (c_day, lotto_type_id) VALUES(?, ?)";
                      connection.query(
                        sqlInsert,
                        [item, lotto_type_id],
                        (error, resultClose, fields) => {}
                      );
                    }
                    //  else {
                    //   sql =
                    //     "DELETE FORM close_lotto WHERE lotto_type_id = ? AND c_day = ?";
                    //   connection.query(
                    //     sql,
                    //     [lotto_type_id, item],
                    //     (error, resultClose, fields) => {
                    //
                    //     }
                    //   );
                    // }
                  }
                );
              });
            }
          }
        } else {
          return res.status(400).send({
            success: false,
            msg: "กรุณากรอกข้อมูลให้ครบ",
          });
        }
      } else {
        res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
      }
    });
  }
);

router.delete("/delete-lotto-type", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    // if (!err) {
    try {
      const lotto_type_id = req.body.lotto_type_id;
      if (lotto_type_id != undefined) {
        var sql = `DELETE FROM lotto_type WHERE lotto_type_id = ?`;
        connection.query(sql, [lotto_type_id], (error, result, fields) => {
          return res.status(200).send({
            status: true,
            msg: "ลบประเภทหวยสำเร็จ",
          });
        });
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง lotto_type_id" });
      }
    } catch (e) {
      console.log(e);
    }
  });
});
module.exports = router;
