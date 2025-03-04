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
            "SELECT dp.*, mb.name, mb.familyName, (SELECT name FROM member WHERE id = dp.user_id) as u_name, (SELECT familyName FROM member WHERE id = dp.user_id) as u_familyName FROM deposite as dp JOIN member as mb ON dp.add_by = mb.id WHERE dp.phone LIKE '%' ? '%' ORDER BY dp.created_at DESC";
        } else {
          var sql =
            "SELECT dp.*, mb.name, mb.familyName, (SELECT name FROM member WHERE id = dp.user_id) as u_name, (SELECT familyName FROM member WHERE id = dp.user_id) as u_familyName FROM deposite as dp JOIN member as mb ON dp.add_by = mb.id ORDER BY dp.created_at DESC";
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
