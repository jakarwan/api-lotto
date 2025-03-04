const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      //   const page = req.query.page;
      //   const perPage = req.query.perPage;
      var sql = "SELECT * FROM bank WHERE status = 1";
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
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

module.exports = router;
