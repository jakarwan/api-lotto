const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");

router.get("/", (req, res) => {
  // jwt.verify(req.token, "secretkey", (err, data) => {
  // if (!err) {
  //   if (req.query.page && req.query.perPage) {
  //   const page = req.query.page;
  //   const perPage = req.query.perPage;
  var sql = "SELECT * FROM type ORDER BY `rank` ASC";
  connection.query(sql, (error, result, fields) => {
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
  // } else {
  //   res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
  // }
  // });
});

router.post("/add-type", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const type = req.body.type;
      if (type) {
        var sql = "INSERT INTO type (type) VALUES(?)";
        connection.query(sql, [type], (error, result, fields) => {
          return res
            .status(200)
            .send({ status: true, msg: "เพิ่มประเภทหวยสำเร็จ" });
        });
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง ชื่อประเภทหวย" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});
module.exports = router;
