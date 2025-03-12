const express = require("express");
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");
const {
  payRateUpdate,
  payRateQuery,
  typeQuery,
  delPayRate,
} = require("../routes/sql/payRate");

router.post("/add-type-options", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      // const name = req.body.name;
      // const price = req.body.price;
      // const type_id = req.body.type_id;
      const type_options = req.body.type_options;
      if (Array.isArray(type_options) && type_options.length !== 0) {
        const values = type_options.map((item) => [
          item.name,
          item.price,
          item.type_id,
        ]);
        var sql = "INSERT INTO type_options (name, price, type_id) VALUES ?";
        connection.query(sql, [values], (error, result, fields) => {
          if (error) {
            return res.status(500).send({ status: true, msg: error });
          }
          return res
            .status(200)
            .send({ status: true, msg: "เพิ่มตัวเลือกแทงสำเร็จ" });
        });
      } else {
        return res.status(400).send({ status: false, msg: "กรุณาส่งข้อมูล" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

module.exports = router;
