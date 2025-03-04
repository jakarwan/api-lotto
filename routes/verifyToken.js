// const express = require("express");
// const app = express();
// const router = express.Router();
// const connection = require("../config/connection");
// const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const bearerHeader = req.headers.authorization;
  if (typeof bearerHeader !== "undefined") {
    const bearerToken = bearerHeader.split(" ")[1];
    req.token = bearerToken;
    next();
  } else {
    return res.status(403).send({ msg: "Forbidden" });
  }
}

module.exports = verifyToken;
