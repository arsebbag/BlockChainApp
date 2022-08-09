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
          res.json("Manager authenticated")// need to add all person details
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
    
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      birthday: req.body.birthday,
      username: req.body.username,
      password: hashedPassword,
      role: null
    });

    await newUser.save();
    res.send("User created");
    
  });
});

// get request route
router.route("/").get((req, res) => {
  User.find()
    .then((user) => res.json(user))
    .catch((err) => res.status(400).json("Error: " + err));
});


//check if ok
const deleteUser = (async (req, res) => {
  try {
    let user = await User.findOneAndDelete({ username: req.body.username });
    if (!user) return res.status(404).send("user with the given id doesn't found");
  } catch (error) { res.status(400).send(error.message); }
});

const removeAllUsers = (async (req, res) => {
  try {
    await User.remove({});
  } catch (error) { res.status(400).send(error.message); }
});

const updateUser = async (req, res) => {
  try {
    const id = req.params.id.slice(1);
    const Data = req.body;

    await User.findOneAndUpdate({ _id: id }, {
      
    }, { new: true });
  } catch (error) {
    res.status(400).send(error.message);
  }
  console.log("1 document updated");
  res.send("1 document updated");
}

/// user's router
router.route("/remove").delete(deleteUser);
router.route("/removeall").delete(removeAllUsers);
router.route("/update/:id").put(updateUser);

module.exports = router;
