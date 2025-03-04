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
            "SELECT p.*, mb.name, mb.familyName, mb.phone, lt.lotto_type_name FROM poy as p JOIN member as mb ON p.created_by = mb.id JOIN lotto_type as lt ON p.lotto_type_id = lt.lotto_type_id WHERE mb.phone LIKE '%' ? '%' OR mb.name LIKE '%' ? '%' OR mb.familyName LIKE '%' ? '%' ORDER BY p.created_at DESC";
        } else {
          var sql =
            "SELECT p.*, mb.name, mb.familyName, mb.phone, lt.lotto_type_name FROM poy as p JOIN member as mb ON p.created_by = mb.id JOIN lotto_type as lt ON p.lotto_type_id = lt.lotto_type_id ORDER BY p.created_at DESC";
        }

        connection.query(
          sql,
          [phone, phone, phone],
          (error, result, fields) => {
            if (result === undefined) {
              return res.status(400).send({ status: false });
            } else {
              const data = paginatedResults(req, res, result);
              return res.status(200).send({ status: true, data });
            }
          }
        );
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
