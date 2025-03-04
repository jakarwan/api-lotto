const express = require("express");
const app = express();
const router = express.Router();
// const { defaults: axios } = require("axios");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

app.use(express.json());
// const connection = require("../config/connection");
// const jwt = require("jsonwebtoken");
// const verifyToken = require("../routes/verifyToken");
// const paginatedResults = require("../routes/pagination");

product = {
  name: "",
  img: "",
  price: "",
  link: "",
};

const book_data = [];

router.get("/", async (req, res) => {
  try {
    const data = await axios.get(
      "http://books.toscrape.com/"
    );

    if (data.status !== 200) {
      return res.status(data.status).send({ msg: "Invalid url" });
    }

    const html = await data.data;
    const $ = cheerio.load(html);

    // const books = $(
    //   "#default > div > div > div > div > section > div:nth-child(2) > ol > li:nth-child(1) > article"
    // );
    // books.each(function () {
    //   title = $(this).find("h3 a").text();

    //   book_data.push({ title });
    // });

    // const item = $("body > div");

    // product.name = $(item).find("div[class=items] > div[class=item]").text().trim();

    // fs.writeFile("product.json", JSON.stringify(product), (err) => {
    //   if (err) {
    //     console.log(err);
    //     return;
    //   }
    //   console.log("completed");
    // });

    // console.log(books);
    return res.status(200).send({ msg: "Ok" });
  } catch (err) {
    console.log(err.message);
  }
});
module.exports = router;
