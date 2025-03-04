const express = require("express");
const router = express.Router();
const connection = require("../config/connection");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");

router.route("/index", verifyToken).get((req, res) => {
  connection.query(
    "SELECT * FROM users where is_active = 1",
    (error, result, fields) => {
      if (result === undefined) {
        return res.status(400).send({ status: "error" });
      } else {
        if (req.query.page && req.query.perPage) {
          const data = paginatedResults(req, res, result);
          return res.status(200).send(data);
        } else {
          return res
            .status(400)
            .send({ status: "error", msg: "กรุณาส่ง page, perPage" });
        }
      }
    }
  );
});

router.route("/search", verifyToken).get((req, res) => {
  if (req.query.page && req.query.perPage) {
    const phone = req.query.phone;
    var sql = "SELECT * FROM users where phoneNumber LIKE ?";
    connection.query(sql, [`%${phone}%`], (error, result, fields) => {
      if (result === undefined) {
        return res.status(400).send({ status: "error" });
      } else {
        const data = paginatedResults(req, res, result);
        // console.log(data)
        return res.status(200).send(data);
      }
    });
  } else {
    return res
      .status(400)
      .send({ status: "error", msg: "กรุณาส่ง page, perPage" });
  }
});

// function paginatedResults(req, res, model) {
//   if(req.query.page && req.query.perPage && model) {
//     const page = req.query.page;
//     const perPage = req.query.perPage;
//     const startIndex = (page - 1) * perPage;
//     const endIndex = page * perPage;

//     const data = model.slice(startIndex, endIndex);
//     return res.send({ data: data, page: page, perPage: perPage ,total: data.length});
//   } else {
//     return res.status(400).send({ status: 'error', msg: 'กรุณากรอก page, perPage'});
//   }
// }

module.exports = router;
