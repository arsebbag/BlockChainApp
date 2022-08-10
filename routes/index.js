//general router - front controller

var express = require('express');
var router = express.Router();
var app = require('../app') 

const cors = require("cors");

router.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});


router.use("/account", require("../features/account/routes/index"))
router.use("/transaction", require("../features/transactions/routes/transactionsR"))
//router.use("/messages", require("../features/messages/routes/"))
router.use("/loan", require("../features/loan/routes/index"))
router.use("/requestedLoan", require("../features/loan/routes/reqLoan"))

module.exports = router;
