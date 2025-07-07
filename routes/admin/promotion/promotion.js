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

    const query = util.promisify(connection.query).bind(connection);

    let sql = `
      SELECT *
      FROM promotions
    `;

    const results = await query(sql, []);

    return res.status(200).json({ status: true, data: results });
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

router.post("/add-promotion", verifyToken, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, "secretkey");
    const {
      promotion_name,
      discount_2top,
      discount_2bottom,
      discount_3top,
      discount_3tod,
      discount_runtop,
      discount_runbottom,
      pay_2top,
      pay_2bottom,
      pay_3top,
      pay_3tod,
      pay_runtop,
      pay_runbottom,
    } = req.body;

    if (
      !promotion_name ||
      !discount_2top ||
      !discount_2bottom ||
      !discount_3top ||
      !discount_3tod ||
      !discount_runtop ||
      !discount_runbottom ||
      !pay_2top ||
      !pay_2bottom ||
      !pay_3top ||
      !pay_3tod ||
      !pay_runtop ||
      !pay_runbottom
    ) {
      return res
        .status(400)
        .json({ status: false, msg: "กรุณากรอกข้อมูลให้ครบ" });
    }

    const query = util.promisify(connection.query).bind(connection);

    const insertPromotion = await query(
      `INSERT INTO promotions 
      (promotion_name,
      discount_2top,
      discount_2bottom,
      discount_3top,
      discount_3tod,
      discount_runtop,
      discount_runbottom,
      pay_2top,
      pay_2bottom,
      pay_3top,
      pay_3tod,
      pay_runtop,
      pay_runbottom)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        promotion_name,
        discount_2top,
        discount_2bottom,
        discount_3top,
        discount_3tod,
        discount_runtop,
        discount_runbottom,
        pay_2top,
        pay_2bottom,
        pay_3top,
        pay_3tod,
        pay_runtop,
        pay_runbottom,
      ]
    );

    return res.status(200).json({
      status: true,
      msg: "เพิ่มโปรโมชั่นส่วนลดสำเร็จ",
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

router.delete("/del-promotion", verifyToken, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, "secretkey");
    const { promotion_id } = req.body;

    if (!promotion_id) {
      return res
        .status(400)
        .json({ status: false, msg: "กรุณาส่ง id promotion" });
    }

    const query = util.promisify(connection.query).bind(connection);

    const delPromotion = await query(
      `DELETE FROM promotions WHERE promotion_id = ?`,
      [promotion_id]
    );

    return res.status(200).json({
      status: true,
      msg: "ลบโปรโมชั่นส่วนลดสำเร็จ",
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
