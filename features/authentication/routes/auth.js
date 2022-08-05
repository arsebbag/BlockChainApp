const router = require("express").Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");

const User = require("../models/user");


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
router.use(passport.session());

router.route("/login").post(async (req, res, next) => {
  await passport.authenticate("local", (err, user, info) => {
    if (err) throw err;
    if (!user) res.send("No user exists");
    else {
      req.logIn(user, async (err) => { //logIn???? where is it? - to asaf
        if (err) throw err;
        let sessUser = await User.findOne({ username: req.body.username }).exec()
        req.session.user = sessUser;

        if (req.session.user.role == 'M')// Manager
        {
          console.log("SUCCESS")//"SUCCESS"
          //res.send("Manager authenticated");
          //console.log(user);
          res.json({ message: "Manager authenticated", userDetails: user })// need to add all person details
        } else if (req.session.user.role == 'B') {
          res.send("Basic user authenticated");
        }
        else {
          res.send("Authentification failed");
        }
      });
    }
  })(req, res, next);
});

router.route("/register").post((req, res) => {
  User.findOne({ username: req.body.username }, async (err, doc) => {
    if (err) throw err;
    if (doc) res.send("User already exists");
    if (!doc) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      
      const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        birthday: req.body.birthday,
        username: req.body.username,
        password: hashedPassword,
        role: req.body.role
      });
      await newUser.save();
      res.send("User created");
    }
  });
});

// get request route
router.route("/").get((req, res) => {
  User.find()
    .then((user) => res.json(user))
    .catch((err) => res.status(400).json("Error: " + err));
});


//check if ok
router.route("/remove").delete(async (req, res) => {
  try {
    let user = await User.findOneAndDelete({ username: req.body.username });
    if (!user) return res.status(404).send("user with the given id doesn't found");
  } catch (error) { res.status(400).send(error.message); }
});

router.route("/removeall").delete(async (req, res) => {
  try {
    await User.remove({});
  } catch (error) { res.status(400).send(error.message); }
});
module.exports = router;
