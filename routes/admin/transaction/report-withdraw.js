const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../../../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../../../routes/verifyToken");
const paginatedResults = require("../../../routes/pagination");

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const page = req.query.page;
      const perPage = req.query.perPage;
      const phone = req.query.phone;
      if (page != null && perPage != null) {
        if (phone != null) {
          var sql =
            "SELECT wd.*, mb.name, mb.familyName FROM withdraw as wd JOIN member as mb ON wd.dis_by = mb.id WHERE wd.phone LIKE '%' ? '%' ORDER BY wd.created_at DESC";
        } else {
          var sql =
            "SELECT wd.*, mb.name, mb.familyName FROM withdraw as wd JOIN member as mb ON wd.dis_by = mb.id ORDER BY wd.created_at DESC";
        }

        connection.query(sql, [phone], (error, result, fields) => {
          if (result === undefined) {
            return res.status(400).send({ status: false });
          } else {
            const data = paginatedResults(req, res, result);
            return res.status(200).send({ status: true, data });
          }
        });
      } else {
        return res
          .status(400)
          .send({ status: "error", msg: "กรุณาส่ง page, perPage" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

module.exports = router;
