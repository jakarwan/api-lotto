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
app.use(express.static(""));
// app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./uploads");
  },
  filename: function (req, file, callback) {
    callback(null, new Date().toISOString() + file.originalname);
  },
});
const fileFilter = (req, file, callback) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

const upload = multer({ dist: "http://localhost:3000/" });
// const upload = multer({ storage: storage, fileFilter: fileFilter });

router.get("/images", verifyToken, (req, res) => {
  if (req.query.page && req.query.perPage) {
    // const phone = req.query.phone;
    const page = req.query.page;
    const perPage = req.query.perPage;
    var sql = "SELECT * FROM menu where is_active = 1";
    connection.query(sql, [page, perPage], (error, result, fields) => {
      if (result === undefined) {
        return res.status(400).send({ status: "error" });
      } else {
        const data = paginatedResults(req, res, result);
        return res.status(200).send(data);
      }
    });
  } else {
    return res
      .status(400)
      .send({ status: "error", msg: "กรุณาส่ง page, perPage" });
  }
});

router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  jwt.verify(req.token, "secretkey", (err, data) => {
    if (err) {
      res.status(403).send({ status: "error", msg: "กรุณาเข้าสู่ระบบ" });
    } else {
      const host = req.hostname;

      if (!req.file) {
        // console.log("กรุณาส่งไฟล์รูปภาพ");
        return res.send({
          status: false,
          msg: "กรุณาอัพโหลดไฟล์รูปภาพ",
        });
      } else {
        try {
          // const filePath =
          //   req.protocol +
          //   "://" +
          //   host +
          //   "/" +
          //   "uploads/" +
          //   req.file.filename;
          const filePath =
            "http://localhost:3000/uploads/" + req.file.originalname;
          const menuName = req.body.menuName;
          const menuPrice = req.body.menuPrice;
          const menuInStock = req.body.menuInStock;
          if (menuName != null && menuPrice != null && menuInStock != null) {
            const { filename: image } = req.file;
            var decoded = jwt.verify(req.token, "secretkey");
            var sqlStore = "SELECT * FROM store where user_id = ?";
            connection.query(
              sqlStore,
              [decoded.user.id],
              (error, resultStore, fields) => {
                if (resultStore != "") {
                  connection.query(
                    "INSERT INTO menu (menu_name, menu_price, menu_in_stock, menu_img, user_id, code_store) VALUES(?, ?, ?, ?, ?, ?)",
                    [
                      req.body.menuName,
                      req.body.menuPrice,
                      req.body.menuInStock,
                      filePath,
                      decoded.user.id,
                      resultStore[0].code_store,
                    ],
                    async (error, result, fields) => {
                      if (result === undefined) {
                        return res.status(400).send({
                          status: "error",
                          msg: "อัพโหลดรูปไม่สำเร็จ",
                        });
                      } else {
                        // await sharp(req.file.path)
                        //   .resize(400, 300)
                        //   .jpeg({ quality: 90 })
                        //   .toFile(path.resolve(req.file.destination, "resized", image));
                        // fs.unlinkSync(req.file.path);

                        return res.status(200).send({
                          status: "success",
                          msg: "อัพโหลดรูปสำเร็จ",
                        });
                        // return res.send({
                        //   status: "success",
                        //   nameFile: req.file.originalname,
                        //   lotteryNumber: req.body.lotteryNumber,
                        //   type_file: req.file.mimetype,
                        //   path: filePath,
                        // });
                      }
                    }
                  );
                } else {
                  return res.status(400).send({
                    status: "error",
                    msg: "ไม่พบร้านค้าของคุณ",
                  });
                }
              }
            );
          } else {
            return res.status(400).send({
              success: false,
              msg: "กรุณากรอกข้อมูลให้ครบ",
            });
          }
        } catch (e) {
          return res.send(e);
        }
      }
    }
  });
});

module.exports = router;
