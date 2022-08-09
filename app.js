var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const passportLocal = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");

var app = express();
var usersRouter = require("./features/authentication/routes/auth");
var allRouters = require("./routes");
const port = 4000;

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/users", usersRouter);
app.use("/routes", allRouters);

//----------------------------------------- END OF IMPORTS---------------------------------------------------
// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  session({
    secret: "secretcode",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(cookieParser("secretcode"));
app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);

app.listen(port, () => {
  console.log("Server is listening to", port);
});

const connectToDB = require('./config/mongooseConnect')
connectToDB();

var notifyRouter = require("./features/notifyManager/routes/notifyRouter");
app.use("/notify", notifyRouter);

// const initChain = require('./config/BlockChainInit')
// initChain();

module.exports = app;

