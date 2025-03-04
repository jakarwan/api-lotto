const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");
const QRCode = require("qrcode");
const generatePayload = require("promptpay-qr");
const axios = require("axios");
const qs = require("qs");
const lineNotifyUrl = "https://notify-api.line.me/api/notify";
const token = "2KIECNH2j4MWNiEu6kRm7sKOmeSUbH8qTI21abzrZUp";

router.post("/generateQR", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      const price = req.body.price;
      if (price != "") {
        var sql = "SELECT * FROM bank WHERE bank_id = 2";
        connection.query(sql, (error, result, fields) => {
          if (result === undefined) {
            return res
              .status(400)
              .send({ status: false, msg: "ไม่พบข้อมูลพร้อมเพย์" });
          } else {
            const randomNumber = Math.floor(Math.random() * 100) + 1;
            const randomAmount = parseFloat(`${price}.${randomNumber}`);
            const amount = randomAmount;

            const mobileNumber = result[0].bank_number;
            const payload = generatePayload(mobileNumber, { amount });
            const option = {
              color: {
                dark: "#000",
                light: "#fff",
              },
            };

            QRCode.toDataURL(payload, option, (err, url) => {
              if (err) {
                return res
                  .status(400)
                  .send({ status: false, msg: "เกิดข้อผิดพลาด" });
              } else {
                var sql =
                  "INSERT INTO generate_qr (amount, created_by) VALUES(?, ?)";
                connection.query(
                  sql,
                  [amount, data.user.id],
                  (error, result, fields) => {
                    return res
                      .status(200)
                      .send({ status: true, data: url, amount: amount });
                  }
                );
              }
            });
          }
        });
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "เกิดข้อผิดพลาด กรุณากรอกจำนวนเงิน" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.post("/submit", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      const amount = req.body.amount;
      if (amount != undefined) {
        var sql =
          "INSERT INTO transaction (phone, amount, user_id, type) VALUES(?, ?, ?, ?)";
        connection.query(
          sql,
          [data.user.phone, amount, data.user.id, "PP"],
          (error, result, fields) => {
            const userInfo = data.user;
            try {
              let message = `--- เงินเข้า ---\nเบอร์โทรศัพท์: ${userInfo.phone}\nจำนวน: ${amount} บาท\nช่องทาง: พร้อมเพย์`;

              const data = qs.stringify({ message });

              const config = {
                method: "post",
                url: lineNotifyUrl,
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                data: data,
              };

              axios(config);
              return res.status(200).send({
                status: false,
                msg: "เติมเงินสำเร็จ รอระบบทำรายการสักครู่",
              });
            } catch (err) {
              console.log("Notify Error!");
              console.log(err);
              res.status(500).send(err);
            }
          }
        );
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "จำนวนเงินไม่ถูกต้อง" });
      }
    } else {
      return res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

module.exports = router;
