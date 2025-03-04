const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");

const users = require("./routes/users");
// const register = require("./routes/register");
const auth = require("./routes/auth");
// const uploadFile = require("./routes/uploadFile");
// const chat = require("./routes/chat");
// const storeMember = require("./routes/storeMember");
const type = require("./routes/type");
const lottoType = require("./routes/lottoType");
const typeOptions = require("./routes/typeOptions");
const getStatus = require("./routes/getStatus");
const lottoNumber = require("./routes/lottoNumber");
const broadcast = require("./routes/broadcast");
const rate = require("./routes/playRate");
const scraper = require("./routes/scraper");
const getPrize = require("./routes/getPrize");
const bank = require("./routes/bank");
const promptpay = require("./routes/promptpayQr");
const withdrawUser = require("./routes/withdraw");
const closeNumber = require("./routes/close_number");
const affiliateUser = require("./routes/affiliate");
const getLottoHistory = require("./routes/getLottoHistory");

///////////////// ADMIN ///////////////////////
const dashboard = require("./routes/admin/dashboard");
const member = require("./routes/admin/member/member");
const lottoPrize = require("./routes/admin/prize/lottoPrize");
const transaction = require("./routes/admin/transaction/transaction");
const withdraw = require("./routes/admin/transaction/withdraw");
const deposite = require("./routes/admin/transaction/deposite");
const affiliate = require("./routes/admin/affiliate/affiliate");
const reportWithdraw = require("./routes/admin/transaction/report-withdraw");
const poy = require("./routes/admin/poy/poy");
const numberBuy = require("./routes/admin/numberBuy/numberBuy");
// const banned = require("./routes/admin/member/bannedUser");
///////////////// ADMIN ///////////////////////
const config = require("./config/config");
require("./cron-job.js");

// const http = require("http").createServer(app);
// const io = require("socket.io")(http, {
//   cors: "*",
// });

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api/images", express.static("uploads"));
app.use(cors());
app.use(express.static("public"));

// app.use("/api", users);
// app.use("/api", register);
app.use("/api/auth", auth);
app.use("/api/users", users);
app.use("/api/type", type);
app.use("/api/lotto-type", lottoType);
app.use("/api/type-options", typeOptions);
app.use("/api/get-status", getStatus);
app.use("/api/lotto", lottoNumber);
app.use("/api/broadcast", broadcast);
app.use("/api/rate", rate);
app.use("/api/scraper", scraper);
app.use("/api/get-prize", getPrize);
app.use("/api/bank", bank);
app.use("/api/promptpay", promptpay);
app.use("/api/withdraw", withdrawUser);
app.use("/api/close-number", closeNumber);
app.use("/api/affiliate-user", affiliateUser);
app.use("/api/lotto-history", getLottoHistory);
app.use("/uploads", express.static("uploads"));
///////////////// ADMIN ///////////////////////
app.use("/api/admin", dashboard);
app.use("/api/admin/member", member);
app.use("/api/admin/prize", lottoPrize);
app.use("/api/admin/transaction", transaction);
app.use("/api/admin/withdraw", withdraw);
app.use("/api/admin/deposite", deposite);
app.use("/api/admin/affiliate", affiliate);
app.use("/api/admin/report-withdraw", reportWithdraw);
app.use("/api/admin/poy", poy);
app.use("/api/admin/get-number-buy", numberBuy);
// app.use("/api/admin/ban-user", banned);

// io.on("connection", function (socket) {
//   console.log("a user connected");
//   socket.on("inputMsg", async function (msg) {
//     io.emit("sendMsg", msg);
//     console.log(msg);
//   });

//   socket.on("disconnect", function () {
//     console.log("user disconnected");
//   });
// });

const port = process.env.PORT || 3035;

app.listen(port, () => {
  console.log("Start server at port " + port);
});
