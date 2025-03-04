const express = require("express");
const router = express.Router();
const connection = require("../config/connection");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");
const jwt = require("jsonwebtoken");

router.post("/test", (req, res) => {
  console.log(req);
});

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      var userId = jwt.verify(req.token, "secretkey");
      var storeId = req.query.storeId;
      if (storeId && req.query.page && req.query.perPage) {
        connection.query(
          "SELECT c.msg, c.created_at, c.is_active, mb.id, mb.name, mb.familyName, mb.address, mb.store_name FROM chat as c LEFT JOIN member as mb ON c.store_id = mb.id WHERE c.is_active = 1 AND c.user_id = ? AND c.store_id = ?",
          [userId.user.id, storeId],
          (error, result, fields) => {
            if (result != "") {
              const data = paginatedResults(req, res, result);
              return res.status(200).send(data);
              //   return res.status(400).send({ status: "error" });
            } else {
              return res
                .status(200)
                .send({ status: "success", msg: "ไม่มีประวัติการคุย" });
            }
          }
        );
      } else {
        return res.status(400).send({
          status: "error",
          msg: "กรุณาส่ง storeId, page, perPage",
        });
      }
    } else {
      res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.post("/send-message", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      var msg = req.body.msg;
      var userId = jwt.verify(req.token, "secretkey");
      var storeId = req.body.storeId;
      var sender = jwt.verify(req.token, "secretkey");
      connection.query(
        "SELECT * FROM member WHERE id = ?",
        [storeId],
        (error, result, fields) => {
          if (result != "") {
            connection.query(
              "INSERT INTO chat (msg, user_id, store_id, sender) VALUES(?, ?, ?, ?)",
              [msg, userId.user.id, storeId, sender.user.role],
              (error, result, fields) => {
                return res.status(200).send({ status: "success" });
              }
            );
          } else {
            return res
              .status(400)
              .send({ status: "error", msg: "ไม่พบร้านค้า" });
          }
        }
      );
    } else {
      res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

module.exports = router;
