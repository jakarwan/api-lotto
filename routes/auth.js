const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/verifyToken");
var bcrypt = require("bcryptjs");
const memberData = require("../import/tb_user.json");

// var ip = require("ip");

router.post("/login", (req, res) => {
  const user = {
    phone: req.body.phone,
    password: req.body.password,
  };
  if (!user.phone || !user.password) {
    return res.status(400).send({ msg: "กรุณากรอก ชื่อผู้ใช้, รหัสผ่าน !" });
  } else {
    connection.query(
      `SELECT * FROM member where phone = ? AND password = ? LIMIT 1`,
      [user.phone, user.password],
      function (error, result, fields) {
        if (error) {
          res.json({ status: false, msg: error });
          return;
        }
        if (result.length == 0) {
          res.status(400).json({
            status: false,
            msg: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
          });
          return;
        } else {
          if (result[0].is_active != 0) {
            delete result[0].password;
            jwt.sign(
              { user: result[0] },
              "secretkey",
              // { expiresIn: "10hr" },
              (err, token) => {
                res.status(200).json({ status: true, data: result[0], token });
                // console.log(req.socket.remoteAddress);
                // connection.query(
                //     `UPDATE member SET ip = ? WHERE id = ?`, [`${ip.address()}`, result[0].id],
                //     function(error, result, fields) {
                //
                //     }
                // );
              }
            );
          } else {
            return res.status(400).json({
              status: false,
              msg: "เข้าสู่ระบบล้มเหลว ไอดีคุณถูกแบน !",
            });
          }
        }
        // bcrypt.compare(
        //   req.body.password,
        //   result[0].password,
        //   function (err, isLogin) {
        //     console.log(isLogin);
        //     if (isLogin) {
        //       delete result[0].password;
        //       jwt.sign(
        //         { user: result[0] },
        //         "secretkey",
        //         // { expiresIn: "10hr" },
        //         (err, token) => {
        //           res.status(200).json({ data: result[0], token });
        //         }
        //       );
        //     } else {
        //       res.status(401).json({
        //         status: "error",
        //         msg: "เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง !",
        //       });
        //     }
        //   }
        // );
      }
    );
  }
});

router.get("/profile", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (err) {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    } else {
      connection.query(
        `SELECT id, phone, credit_balance, name, familyName, bank, bank_number, created_at, updated_at, is_active, role, profile_img, refs_code, aff_percentage FROM member WHERE id = ?`,
        [data.user.id],
        function (error, result, fields) {
          if (result != "") {
            res.status(200).json({
              status: true,
              data: result[0],
            });
          } else {
            res.status(400).json({
              status: false,
              msg: "ไม่พบโปรไฟล์นี้",
            });
          }
        }
      );
    }
  });
});

// function verifyToken(req, res, next) {
//   const bearerHeader = req.headers.authorization;
//   if (typeof bearerHeader !== "undefined") {
//     const bearerToken = bearerHeader.split(" ")[1];
//     req.token = bearerToken;
//     next();
//   } else {
//     return res.status(403).send({ msg: "Forbidden" });
//   }
// }

router.post("/register", async (req, res) => {
  //   var username = req.body.username;
  //   var name = req.body.name;
  var refs = req.query.refs;
  var phone = req.body.phone;
  var password = req.body.password;
  var name = req.body.name;
  var familyName = req.body.familyName;
  var bank = req.body.bank;
  var bankNumber = req.body.bankNumber;
  // var ip = req.body.ip;
  //   bcrypt.hash(password, 10)
  if (refs != "" && refs != undefined) {
    console.log("if");
    // var encryptedPassword = await bcrypt.hash(password, 10);
    const generateId = function makeid(length) {
      var result = "";
      var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      // console.log(result);
      return result;
    };
    const refsCode = generateId(10);

    if (!phone || !password || !name || !familyName || !bank || !bankNumber) {
      return res.status(400).send({ msg: "กรุณากรอกข้อมูลให้ครบ" });
    } else {
      connection.query(
        `SELECT * FROM member where is_active = 1 AND phone = ?`,
        [phone],
        (error, result, fields) => {
          if (result === undefined || result.length == 0) {
            connection.query(
              `SELECT * FROM member where is_active = 1 AND phone = ?`,
              [refs],
              (error, resultRefs, fields) => {
                console.log(resultRefs, "resultRefs");
                if (resultRefs.length > 0) {
                  connection.query(
                    `INSERT INTO member (refs_code, phone, password, name, familyName, bank, bank_number) VALUES(?, ?, ?, ? ,? ,?, ?)`,
                    [refs, phone, password, name, familyName, bank, bankNumber],
                    (error, result, fields) => {
                      if (error) throw error;
                      connection.query(
                        `SELECT * FROM member WHERE id = ?`,
                        [result.insertId],
                        (error, resultUser, fields) => {
                          connection.query(
                            `INSERT INTO affiliate (refs_code, aff_code, aff_percentage) VALUES(?, ?, ?)`,
                            [refs, resultUser[0].phone, 5],
                            (error, result, fields) => {
                              return res.status(200).send({
                                status: true,
                                msg: "สมัครสมาชิกสำเร็จ !",
                              });
                            }
                          );
                        }
                      );
                    }
                  );
                } else {
                  return res.status(400).send({
                    status: false,
                    msg: "ไม่พบผู้ใช้นี้",
                  });
                }
              }
            );
          } else {
            return res.status(400).send({
              status: false,
              msg: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว",
            });
          }
        }
      );
    }
  } else {
    console.log("else");
    // var encryptedPassword = await bcrypt.hash(password, 10);
    const generateId = function makeid(length) {
      var result = "";
      var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      // console.log(result);
      return result;
    };
    const refsCode = generateId(10);

    if (!phone || !password || !name || !familyName || !bank || !bankNumber) {
      return res.status(400).send({ msg: "กรุณากรอกข้อมูลให้ครบ" });
    } else {
      connection.query(
        `SELECT * FROM member where is_active = 1 AND phone = ?`,
        [phone],
        (error, result, fields) => {
          if (result === undefined || result.length == 0) {
            connection.query(
              `INSERT INTO member (refs_code, phone, password, name, familyName, bank, bank_number) VALUES(?, ?, ?, ? ,? ,?, ?)`,
              [refsCode, phone, password, name, familyName, bank, bankNumber],
              (error, result, fields) => {
                return res
                  .status(200)
                  .send({ status: true, msg: "สมัครสมาชิกสำเร็จ !" });
              }
            );
          } else {
            return res.status(400).send({
              status: false,
              msg: "หมายเลขโทรศัพท์นี้ถูกใช้งานแล้ว",
            });
          }
        }
      );
    }
  }
});

router.post("/register/admin", verifyToken, async (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (err) {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    } else {
      if (data.user.role === "SADMIN") {
        var phone = req.body.phone;
        var password = req.body.password;
        var name = req.body.name;
        var familyName = req.body.familyName;
        var role = "SADMIN";
        //   bcrypt.hash(password, 10)
        if (!phone || !password || !name || !familyName) {
          return res.status(400).send({ msg: "กรุณากรอกข้อมูลให้ครบ" });
        } else {
          connection.query(
            `SELECT * FROM member where is_active = 1 AND phone = ?`,
            [phone],
            (error, result, fields) => {
              if (result === undefined || result.length == 0) {
                connection.query(
                  `INSERT INTO member (phone, password, name, familyName, role) VALUES(?, ?, ?, ?, ?)`,
                  [phone, password, name, familyName, role],
                  (error, result, fields) => {
                    return res
                      .status(200)
                      .send({ status: true, msg: "สมัครสมาชิกสำเร็จ !" });
                  }
                );
              } else {
                return res.status(400).send({
                  status: false,
                  msg: "หมายเลขโทรศัพท์นี้ถูกใช้งานแล้ว",
                });
              }
            }
          );
        }
      } else {
        return res.status(403).send({
          status: false,
          msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
        });
      }
    }
  });
});

router.post("/register/import", verifyToken, async (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (memberData) {
      memberData.forEach((item) => {
        const generateId = function makeid(length) {
          var result = "";
          var characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          var charactersLength = characters.length;
          for (var i = 0; i < length; i++) {
            result += characters.charAt(
              Math.floor(Math.random() * charactersLength)
            );
          }
          // console.log(result);
          return result;
        };
        const refsCode = generateId(10);
        connection.query(
          `INSERT INTO member (refs_code, phone, password, name, familyName) VALUES(?, ?, ?, ?, ?)`,
          [refsCode, item.user_username, "12345678", item.user_name, ""],
          (error, result, fields) => {}
        );
      });
      return res
        .status(200)
        .send({ status: true, msg: "import data complete !" });
    }
    // console.log(memberData);
    //   if (err) {
    //     res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    //   } else {
    //     if (data.user.role === "SADMIN") {
    //       if (!phone || !password || !name || !familyName) {
    //         return res.status(400).send({ msg: "กรุณากรอกข้อมูลให้ครบ" });
    //       } else {
    //         connection.query(
    //           `SELECT * FROM member where is_active = 1 AND phone = ?`,
    //           [phone],
    //           (error, result, fields) => {
    //             if (result === undefined || result.length == 0) {
    //               connection.query(
    //                 `INSERT INTO member (phone, password, name, familyName, role) VALUES(?, ?, ?, ?, ?)`,
    //                 [phone, password, name, familyName, role],
    //                 (error, result, fields) => {
    //                   return res
    //                     .status(200)
    //                     .send({ status: true, msg: "สมัครสมาชิกสำเร็จ !" });
    //                 }
    //               );
    //             } else {
    //               return res.status(400).send({
    //                 status: false,
    //                 msg: "หมายเลขโทรศัพท์นี้ถูกใช้งานแล้ว",
    //               });
    //             }
    //           }
    //         );
    //       }
    //     } else {
    //       return res.status(403).send({
    //         status: false,
    //         msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
    //       });
    //     }
    //   }
  });
});
module.exports = router;
