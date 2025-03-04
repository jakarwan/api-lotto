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
      //   if (req.query.page && req.query.perPage) {
      //   const page = req.query.page;
      const phone = req.query.phone;
      if (phone != null) {
        var sql =
          "SELECT al.*, mb.phone, mb.name, mb.familyName FROM aff_log as al JOIN member as mb ON al.refs_code = mb.refs_code WHERE mb.phone LIKE '%' ? '%' ORDER BY al.created_at DESC";
      } else {
        var sql =
          "SELECT al.*, mb.phone, mb.name, mb.familyName FROM aff_log as al JOIN member as mb ON al.refs_code = mb.refs_code ORDER BY al.created_at DESC";
      }
      connection.query(sql, [phone], (error, result, fields) => {
        if (result === undefined) {
          return res.status(400).send({ status: false });
        } else {
          const data = paginatedResults(req, res, result);
          return res.status(200).send({ status: true, data });
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

router.post("/add-type", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      const type = req.body.type;
      if (type) {
        var sql = "INSERT INTO type (type) VALUES(?)";
        connection.query(sql, [type], (error, result, fields) => {
          return res
            .status(200)
            .send({ status: true, msg: "เพิ่มประเภทหวยสำเร็จ" });
        });
      } else {
        return res
          .status(400)
          .send({ status: false, msg: "กรุณาส่ง ชื่อประเภทหวย" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/aff-log-daily", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      if (req.query.page && req.query.perPage) {
        //   const page = req.query.page;
        const phone = req.query.phone;
        if (phone != null) {
          var sqlQuery = `SELECT GROUP_CONCAT(id) as id FROM member WHERE phone LIKE '%' ? '%'`;
          connection.query(sqlQuery, [phone], (error, resultMember, fields) => {
            // return res.status(200).send({ status: true, data: resultMember });
            if (resultMember[0].id != null) {
              const rs = resultMember[0].id.split(",");
              let text = "'" + rs.join("','") + "'";
              var sql = `SELECT *, (SELECT phone FROM member WHERE id = m_id_header) as phone_header, (SELECT phone FROM member WHERE id = m_id_user) as phone_user FROM aff_log_daily WHERE m_id_user IN (${text})`;
              connection.query(sql, [text], (error, result, fields) => {
                if (error) throw error;
                if (result === undefined) {
                  return res.status(400).send({ status: false });
                } else {
                  const data = paginatedResults(req, res, result);
                  return res.status(200).send({ status: true, data });
                }
              });
            } else {
              return res
                .status(200)
                .send({ status: false, data: { data: [] } });
            }
          });
        } else {
          var sql =
            "SELECT *, (SELECT phone FROM member WHERE id = m_id_header) as phone_header, (SELECT phone FROM member WHERE id = m_id_user) as phone_user FROM aff_log_daily";
          connection.query(sql, [phone], (error, result, fields) => {
            if (result === undefined) {
              return res.status(400).send({ status: false });
            } else {
              const data = paginatedResults(req, res, result);
              return res.status(200).send({ status: true, data });
            }
          });
        }
      } else {
        res.status(400).send({ status: false, msg: "กรุณาส่ง page, perPage" });
      }
    } else {
      res.status(403).send({ status: false, msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});

router.get("/transfer-log-aff", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      if (req.query.page && req.query.perPage) {
        //   const page = req.query.page;
        const phone = req.query.phone;
        if (phone != null) {
          var sqlQuery = `SELECT GROUP_CONCAT(id) as id FROM member WHERE phone LIKE '%' ? '%'`;
          connection.query(sqlQuery, [phone], (error, resultMember, fields) => {
            // return res.status(200).send({ status: true, data: resultMember });
            if (resultMember[0].id != null) {
              const rs = resultMember[0].id.split(",");
              let text = "'" + rs.join("','") + "'";
              var sql = `SELECT *, (SELECT phone FROM member WHERE id = m_id) as phone FROM transfer_log_aff WHERE m_id IN (${text})`;
              connection.query(sql, (error, resultTransfer, fields) => {
                if (error) throw error;
                if (resultTransfer === undefined) {
                  return res.status(400).send({ status: false });
                } else {
                  const data = paginatedResults(req, res, resultTransfer);
                  return res.status(200).send({ status: true, data });
                }
              });
            } else {
              return res
                .status(200)
                .send({ status: false, data: { data: [] } });
            }
          });
        } else {
          var sql = `SELECT *, (SELECT phone FROM member WHERE id = m_id) as phone FROM transfer_log_aff`;
          connection.query(sql, (error, resultTransfer, fields) => {
            if (error) throw error;
            if (resultTransfer === undefined) {
              return res.status(400).send({ status: false });
            } else {
              const data = paginatedResults(req, res, resultTransfer);
              return res.status(200).send({ status: true, data });
            }
          });
        }

        //   } else {
        //     return res.status(400).send({ status: false });
        //   }
        // });
        // } else {
        //   return res
        //     .status(400)
        //     .send({ status: "error", msg: "กรุณาส่ง phone" });
        // }
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
