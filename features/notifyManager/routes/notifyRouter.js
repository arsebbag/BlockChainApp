const router = require("express").Router();
const Notify = require("../models/notify");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");



//const { isManager } = require("../../../utils/common")

router.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
// encrypt the session details.
router.use(
  session({
    secret: "secretcode",
    resave: true,
    saveUninitialized: true,
  })
);

router.route("/").get((req, res) => {
  Notify.find()
    .then((user) => res.json(user))
    .catch((err) => res.status(400).json("Error: " + err));
});

module.exports = router;
