const express = require("express");
const app = express();
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

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      // const rateId = req.query.rateId;
      const huayId = req.query.huayId;
      //   const perPage = req.query.perPage;
      if (huayId) {
        var sql = "SELECT * FROM lotto_type WHERE lotto_type_id = ?";
        connection.query(sql, [huayId], (error, resultLotto, fields) => {
          if (resultLotto != "") {
            // var sql =
            //   "SELECT t.type_option_id, t.name, t.price, t.promotion_id, t.group_option, `t.rank`, t.pay_by_type, t.type_id, pmt.discount FROM type_options as t JOIN promotions as pmt ON t.promotion_id = pmt.promotion_id WHERE t.promotion_id = ? ORDER BY `rank` ASC";
            var sql =
              "SELECT tot.type_option_id, tot.name, tot.price, tot.group_option, tot.rank, tot.type_id, t.type_id, t.type FROM type_options as tot LEFT JOIN type as t ON tot.type_id = t.type_id WHERE tot.type_id = ?";
            connection.query(
              sql,
              [resultLotto[0].type_id],
              (error, result, fields) => {
                if (result == "") {
                  return res
                    .status(400)
                    .send({ status: false, msg: "ไม่พบรหัสการแทงนี้" });
                } else {
                  return res.status(200).send({
                    status: true,
                    data: result,
                    detail: resultLotto[0],
                  });
                }
              }
            );
          } else {
            return res
              .status(400)
              .send({ status: false, msg: "ไม่พบรหัสหวยนี้" });
          }
        });
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง rateId, huayId" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

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

router.put("/edit-type-options", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, data) => {
    if (!err) {
      const name = req.body.name;
      const price = req.body.price;
      const type_option_id = req.body.type_option_id;
      if (name != null && price != null) {
        // var sql =
        //   "UPDATE type_options SET (name, price) = ? WHERE type_option_id = ?";
        // connection.query(
        //   sql,
        //   [type_option_id, name, price],
        //   (error, result, fields) => {
        //     return res
        //       .status(200)
        //       .send({ status: true, msg: "เพิ่มตัวเลือกแทงสำเร็จ" });
        //   }
        // );
        var params = [name, price, type_option_id];
        const updateRate = await payRateUpdate(params);
        return res
          .status(200)
          .send({ status: true, msg: "แก้ไขอัตราจ่ายสำเร็จ" });
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง name, price" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

// router.get("/payrate", verifyToken, (req, res) => {
//   jwt.verify(req.token, "secretkey", async (err, data) => {
//     if (!err) {
//       const payrate = await payRateQuery();
//       return res.status(200).send({ status: true, data: payrate });
//       // return res
//       //   .status(400)
//       //   .send({ status: false, msg: "กรุณาส่ง name, price" });
//     } else {
//       res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
//     }
//   });
// });

router.get("/type", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, data) => {
    if (!err) {
      const type = await typeQuery();
      return res.status(200).send({ status: true, data: type });
      // return res
      //   .status(400)
      //   .send({ status: false, msg: "กรุณาส่ง name, price" });
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.delete("/delete-payrate", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, data) => {
    if (!err) {
      const type_id = req.body.type_id;
      var params = [type_id];
      const type = await delPayRate(params);
      return res.status(200).send({ status: true, msg: "ลบข้อมูลสำเร็จ" });
      // return res
      //   .status(400)
      //   .send({ status: false, msg: "กรุณาส่ง name, price" });
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/payrate", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const type_id = req.query.type_id;
      var sql =
        "SELECT tot.type_option_id, tot.name, tot.price, tot.group_option, tot.rank, tot.type_id, t.type_id, t.type FROM type_options as tot LEFT JOIN type as t ON tot.type_id = t.type_id WHERE tot.type_id = ?";
      connection.query(sql, [type_id], (error, result, fields) => {
        return res.status(200).send({ status: true, data: result });
      });
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});
module.exports = router;
