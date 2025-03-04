const express = require("express");
const morgan = require("morgan");
const router = express.Router();
const app = express();
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const verifyToken = require("../routes/verifyToken");
const jwt = require("jsonwebtoken");
const connection = require("../config/connection");
const paginatedResults = require("../routes/pagination");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(express.static("public"));

// const storage = multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, "./uploads");
//   },
//   filename: function (req, file, callback) {
//     callback(null, new Date().toISOString() + file.originalname);
//   },
// });
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const fileFilter = (req, file, callback) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

// const upload = multer({ dist: "http://localhost:3000/" });
// var upload = multer({ dest: 'upload/'});
// const upload = multer({ storage: storage, fileFilter: fileFilter });
const upload = multer({ storage: storage, fileFilter: fileFilter });

router.get("/", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      //   if (req.query.page && req.query.perPage) {
      //   const page = req.query.page;
      //   const perPage = req.query.perPage;
      // const typeId = req.query.typeId;
      var sql = "SELECT * FROM broadcast WHERE active = 1 ORDER BY `rank` ASC";
      connection.query(sql, (error, result, fields) => {
        if (result === undefined) {
          return res.status(400).send({ status: false });
        } else {
          //   const data = paginatedResults(req, res, result);
          return res.status(200).send({ status: true, data: result });
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

router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (!err) {
      // const filePath =
      //   req.protocol +
      //   "://" +
      //   host +
      //   "/" +
      //   "uploads/" +
      //   req.file.filename;
      // const host = req.hostname;
      // const name = req.body.name;
      // const hostname = "api.laosviangjanvip.com";
      const reqhttps = "https";
      //   const lotto_type_img = req.file;
      const rank = req.body.rank;
      const closing_time = req.body.closing_time;
      if (req.file != null) {
        const { filename: image } = req.file;
        const filePath = reqhttps + "://" + req.get('host') + "/" + "uploads/" + image;
        // const filePath = "http://localhost:3000/uploads/" + image;
        var sql = "INSERT INTO broadcast (broadcast_img, `rank`) VALUES(?, ?)";
        connection.query(sql, [filePath, rank], (error, result, fields) => {
          return res.status(200).send({
            status: true,
            msg: "เพิ่มข้อมูล broadcast สำเร็จ",
          });
        });
      } else {
        return res.status(400).send({
          success: false,
          msg: "กรุณากรอกข้อมูลให้ครบ",
        });
      }
    } else {
      res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
    }
  });
});
module.exports = router;
