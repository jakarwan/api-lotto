const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/verifyToken");
const paginatedResults = require("../routes/pagination");
const moment = require("moment");
const { refundLossQuery, getPhoneQuery } = require("../routes/sql/refundLoss");

router.get("/", async (req, res) => {
  // jwt.verify(req.token, "secretkey", (err, data) => {
  // if (!err) {
  var phone = req.query.phone;
  var startDate = req.query.startDate;
  var endDate = req.query.endDate;
  if (phone != null && startDate != null && endDate != null) {
    var paramsPhone = [phone];
    const getPhone = await getPhoneQuery(paramsPhone);
    if (getPhone) {
      console.log(getPhone, "getPhone");
      var params = [getPhone[0].id, startDate, endDate];
      const refundLoss = await refundLossQuery(params);
      return res.status(200).send({ status: true, data: refundLoss });
    }
  } else {
    return res.status(400).send({ status: false, msg: "กรุณาส่งข้อมูลผู้ใช้ startDate, endDate" });
  }
});

module.exports = router;
