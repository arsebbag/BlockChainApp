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
const socket = require("socket.io");
const messageRoutes = require("./features/chat/routes/messages");
const authRoutes = require("./features/chat/routes/auth");



//----------------------------------------- END OF IMPORTS---------------------------------------------------
var app = express();
var usersRouter = require("./features/authentication/routes/auth");
var allRouters = require("./routes");
const port = 4000;
// Middlewares
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/users", usersRouter);
app.use("/routes", allRouters);
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
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.use(cookieParser("secretcode"));
app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);

const server = app.listen(port, () => {
  console.log("Server is listening to", port);
});

const connectToDB = require('./config/mongooseConnect')
connectToDB();

var notifyRouter = require("./features/notifyManager/routes/notifyRouter");
app.use("/notify", notifyRouter);

const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;

  socket.on("notify-user", (userId) => {
    console.log(userId);

    socket.emit("zero" );
  });

  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});


// const initChain = require('./config/BlockChainInit')
// initChain();

module.exports = app;

