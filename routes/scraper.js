const express = require("express");
const app = express();
const router = express.Router();
const axios = require("axios");
const puppeteer = require("puppeteer");

app.use(express.json());

router.get("/", async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: true }); // เปิด browser แบบไม่โชว์ UI
    const page = await browser.newPage();

    await page.goto("https://news.sanook.com/lotto/", {
      waitUntil: "domcontentloaded",
    });

    const results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".lotto-check__article")).map(
        (article) => {
          const date = article
            .querySelector(".lotto-check__title a")
            ?.textContent.trim();
          const prize1 = article
            .querySelector("p:nth-of-type(1) b")
            ?.textContent.trim();
          const front3 = Array.from(
            article.querySelectorAll("p:nth-of-type(2) b")
          ).map((el) => el.textContent.trim());
          const last3 = Array.from(
            article.querySelectorAll("p:nth-of-type(3) b")
          ).map((el) => el.textContent.trim());
          const last2 = article
            .querySelector("p:nth-of-type(4) b")
            ?.textContent.trim();

          return {
            date,
            prize1,
            front3,
            last3,
            last2,
          };
        }
      );
    });

    await browser.close();
    return res.status(200).send({ status: true, data: results });
  } catch (err) {
    console.log(err);
  }
});
module.exports = router;
