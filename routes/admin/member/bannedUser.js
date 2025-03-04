// const express = require("express");
// const app = express();
// const router = express.Router();
// const connection = require("../../../config/connection");
// const jwt = require("jsonwebtoken");
// const verifyToken = require("../../../routes/verifyToken");
// const paginatedResults = require("../../../routes/pagination");
// // const moment = require("moment");

// router.put("/", verifyToken, (req, res) => {
//   jwt.verify(req.token, "secretkey", (err, user) => {
//     if (!err) {
//       //   var d = moment(new Date()).format("YYYY-MM-DD");
//       var page = req.query.page;
//       var perPage = req.query.perPage;
//       if (page != null && perPage != null) {
//         var sql = "SELECT * FROM member ORDER BY credit_balance DESC";
//         connection.query(sql, (error, result, fields) => {
//
//           const data = paginatedResults(req, res, result);
//           return res.status(200).send({ status: true, data });
//         });
//       } else {
//         return res
//           .status(403)
//           .send({ status: false, msg: "กรุณาส่ง page, perPage" });
//       }
//     } else {
//       return res
//         .status(403)
//         .send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
//     }
//   });
// });

// module.exports = router;
