const express = require("express");
const app = express();
const router = express.Router();
const connection = require("../../../config/connection");
const jwt = require("jsonwebtoken");
const verifyToken = require("../../../routes/verifyToken");
const paginatedResults = require("../../../routes/pagination");

const util = require("util");

router.get("/", verifyToken, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, "secretkey");
    if (decoded.user.role !== "SADMIN") {
      return res
        .status(403)
        .json({ status: false, msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }
    const page = parseInt(req.query.page);
    const perPage = parseInt(req.query.perPage);
    const phone = req.query.phone || "";
    console.log(page, "page");
    if (!page || !perPage) {
      return res
        .status(400)
        .json({ status: false, msg: "กรุณาส่ง page, perPage" });
    }

    const query = util.promisify(connection.query).bind(connection);

    let sql = `
      SELECT 
        pl.lotto_type_id,
        pl.lotto_date,
        pl.created_at,
        pl.created_by,
        pl.total,
        pl.poy_code, 
        mb.name, 
        mb.familyName, 
        mb.phone,
        (SELECT lotto_type_name FROM lotto_type WHERE lotto_type_id = pl.lotto_type_id) as lotto_type_name
      FROM prize_log as pl 
      JOIN member as mb ON pl.created_by = mb.id
    `;

    const params = [];

    if (phone) {
      sql +=
        " WHERE (mb.phone LIKE CONCAT('%', ?, '%') OR mb.name LIKE CONCAT('%', ?, '%')) ";
      params.push(phone, phone);
    }

    sql += " ORDER BY pl.created_at DESC";

    const results = await query(sql, params);

    if (!results.length) {
      return res.status(404).json({ status: false, msg: "ไม่พบข้อมูล" });
    }

    const paginatedData = paginatedResults(req, res, results);

    return res.status(200).json({ status: true, data: paginatedData });
  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
    return res
      .status(500)
      .json({ status: false, msg: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

router.get("/credit-log", verifyToken, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, "secretkey");
    if (decoded.user.role !== "SADMIN") {
      return res
        .status(403)
        .json({ status: false, msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }
    const page = parseInt(req.query.page);
    const perPage = parseInt(req.query.perPage);
    const phone = req.query.phone || "";

    if (!page || !perPage) {
      return res
        .status(400)
        .json({ status: false, msg: "กรุณาส่ง page, perPage" });
    }

    const query = util.promisify(connection.query).bind(connection);

    let sql = `
        SELECT 
          cl.credit_previous,
          cl.credit_after,
          cl.created_by,
          cl.created_at,
          cl.lotto_type_id,
          cl.note,
          cl.installment, 
          cl.prize,
          cl.ref_code,
          cl.poy_code,
          mb.name, 
          mb.familyName, 
          mb.phone,
          (SELECT lotto_type_name FROM lotto_type WHERE lotto_type_id = cl.lotto_type_id) as lotto_type_name
        FROM credit_log as cl 
        JOIN member as mb ON cl.created_by = mb.id
      `;

    const params = [];

    if (phone) {
      sql +=
        " WHERE (mb.phone LIKE CONCAT('%', ?, '%') OR mb.name LIKE CONCAT('%', ?, '%')) ";
      params.push(phone, phone);
    }

    sql += " ORDER BY cl.created_at DESC";

    const results = await query(sql, params);

    if (!results.length) {
      return res.status(404).json({ status: false, msg: "ไม่พบข้อมูล" });
    }

    const paginatedData = paginatedResults(req, res, results);

    return res.status(200).json({ status: true, data: paginatedData });
  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
    return res
      .status(500)
      .json({ status: false, msg: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

router.get("/report-lotto", verifyToken, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, "secretkey");
    if (decoded.user.role !== "SADMIN") {
      return res
        .status(403)
        .json({ status: false, msg: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }
    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ status: false, msg: "กรุณาส่ง startDate, endDate" });
    }

    const query = util.promisify(connection.query).bind(connection);

    let sql = `
        SELECT 
    lt.lotto_type_id,
    lt.lotto_type_name,
    COALESCE(SUM(p.total), 0) AS total,
    COALESCE(SUM(p.discount), 0) AS total_discount,
    COALESCE(SUM(ln.total * ln.pay), 0) AS sum_prize
FROM 
    lotto_type AS lt
LEFT JOIN 
    poy AS p ON lt.lotto_type_id = p.lotto_type_id
    AND p.date_lotto >= ?
    AND p.date_lotto < DATE_ADD(?, INTERVAL 1 DAY)
LEFT JOIN 
    lotto_number AS ln ON p.poy_code = ln.poy_code 
    AND ln.status = 'suc' 
    AND ln.installment_date >= ?
    AND ln.installment_date < DATE_ADD(?, INTERVAL 1 DAY)
GROUP BY 
    lt.lotto_type_id, lt.lotto_type_name
      `;

    const params = [];

    if (startDate && endDate) {
      // sql +=
      //   " WHERE p.date_lotto >= ? AND p.date_lotto < DATE_ADD(?, INTERVAL 1 DAY) ";
      params.push(startDate, endDate, startDate, endDate);
    }

    sql += " ORDER BY total DESC";

    const results = await query(sql, params);

    if (!results.length) {
      return res.status(404).json({ status: false, msg: "ไม่พบข้อมูล" });
    }

    // const paginatedData = paginatedResults(req, res, results);
    var grandTotalPrice = 0;
    var grandDiscount = 0;
    var grandTotalPrize = 0;
    results.forEach((element) => {
      grandTotalPrice += element.total;
      grandDiscount += element.total_discount;
      grandTotalPrize += element.sum_prize;
    });
    return res.status(200).json({
      status: true,
      data: results,
      grandTotalPrice,
      grandDiscount,
      grandTotalPrize,
    });
  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
    return res
      .status(500)
      .json({ status: false, msg: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

router.post("/credit-transfer", verifyToken, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, "secretkey");
    const { creditTransfer, note } = req.body;

    if (!creditTransfer || !note) {
      return res
        .status(400)
        .json({ status: false, msg: "กรุณาส่ง creditTransfer, note" });
    }

    const query = util.promisify(connection.query).bind(connection);

    const [user] = await query(
      `SELECT credit_balance FROM member WHERE id = ?`,
      [decoded.user.id]
    );
    const creditTransferAfter = user.credit_balance - creditTransfer;
    const insertCreditLog = await query(
      `INSERT INTO credit_log (credit_previous, credit_after, created_by, note)
       VALUES (?, ?, ?, ?)`,
      [user.credit_balance, creditTransferAfter, decoded.user.id, note]
    );

    return res.status(200).json({
      status: true,
      msg: "โยกเงินสำเร็จ",
    });
  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
    return res
      .status(500)
      .json({ status: false, msg: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

module.exports = router;
