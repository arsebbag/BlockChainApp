const router = require("express").Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");

const User = require("../models/user");
const Account = require("../../account/models/account")

//const Utils = require("../../../utils");

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
      req.logIn(user, async (err) => { 
        if (err) throw err;
        let sessUser = await User.findOne({ username: req.body.username }).exec().catch(() => sessUser = null)
        let account = await Account.findOne({ ownerId: sessUser.id }).exec().catch(() => account = null)
        if (sessUser.role == 'M')// Manager
        {

          res.send({ message: "Manager authenticated", userDetails: sessUser, accountDetails: account })
        } else if (sessUser.role == 'B') {

          res.send({ message: "Basic user authenticated", userDetails: sessUser, accountDetails: account })
        }
        else if (sessUser.role == null){
          res.send({ message: "Authentification failed - manager need to aprove this account"});
        }
        else {
          res.send({ message: "Authentification failed"});
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
const deleteUser = async (req, res) => {
  //need to check if the session is a admin 
  const id = req.params.id.slice(1);
  const tran = await User.findByIdAndRemove(id).exec(async function (err, item) {
    if (err) {
      return res.json({ success: false, msg: 'Cannot remove item' });
    }
    if (!item) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }
    let userCount = await User.countDocuments({});
    res.json({ success: true, msg: 'user deleted.', "user count:": `there are ${userCount} left`});
  });
}

const removeAllUsers = (async (req, res) => {
  try {
    await User.remove({});
  } catch (error) { res.status(400).send(error.message); }
});

router.route("/getUser/:username").get(async (req, res, next) => {
  try {
    const users = await User.find({
      username: { $eq: req.params.username },
    }).select([
      "email",
      "phone",
      "firstName",
      "lastName",
      "username",
      "avatarImage",
      "role",
      "_id",
      "balance",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
});


/// user's router
router.route("/remove/:id").get(deleteUser);
router.route("/removeall").delete(removeAllUsers);
//router.route("/update/:id").put(updateUser);

module.exports = router;

// {
//   "_id": "62ebe0f9bc7cba1861fc0d3f",
//     "username": " Hillel",
//       "password": "$2a$10$FaYzD6gCVFX24LlmsqWo6.TvzvdVhIAMWJQtDsaFfj1Qn9YoCLL5q",
//         "role": "B",
//           "__v": 0,
//             "avatarImage": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzEgMjMxIj48cGF0aCBkPSJNMzMuODMsMzMuODNhMTE1LjUsMTE1LjUsMCwxLDEsMCwxNjMuMzQsMTE1LjQ5LDExNS40OSwwLDAsMSwwLTE2My4zNFoiIHN0eWxlPSJmaWxsOiMwREMxNUM7Ii8+PHBhdGggZD0ibTExNS41IDUxLjc1YTYzLjc1IDYzLjc1IDAgMCAwLTEwLjUgMTI2LjYzdjE0LjA5YTExNS41IDExNS41IDAgMCAwLTUzLjcyOSAxOS4wMjcgMTE1LjUgMTE1LjUgMCAwIDAgMTI4LjQ2IDAgMTE1LjUgMTE1LjUgMCAwIDAtNTMuNzI5LTE5LjAyOXYtMTQuMDg0YTYzLjc1IDYzLjc1IDAgMCAwIDUzLjI1LTYyLjg4MSA2My43NSA2My43NSAwIDAgMC02My42NS02My43NSA2My43NSA2My43NSAwIDAgMC0wLjA5OTYxIDB6IiBzdHlsZT0iZmlsbDojYzU3YjE0OyIvPjxwYXRoIGQ9Im0xMTUuNSAyMzFhMTE1IDExNSAwIDAgMCA2NC4yMy0xOS41IDExNC43OSAxMTQuNzkgMCAwIDAtMzgtMTYuNWwtMi40MS05YTEyNS4xOSAxMjUuMTkgMCAwIDAtMTMuMzItMi4yOHY4Ljc1cTMuNTIgMC4zMiA3IDAuODRsLTE3LjUgMTcuNDgtMTcuNS0xNy40OHEzLjQ1LTAuNTIgNy0wLjg0di04Ljc1YTEyNS41NSAxMjUuNTUgMCAwIDAtMTMuMzQgMi4yOGwtMi40MSA5YTExNC43OSAxMTQuNzkgMCAwIDAtMzggMTYuNSAxMTQuOTQgMTE0Ljk0IDAgMCAwIDY0LjI1IDE5LjV6IiBzdHlsZT0iZmlsbDojMDAwOyIvPjxwYXRoIGQ9Im0xMzIuOTggMTkzLjMzLTM2LjE4NSAzNi4xNTUtMi40LTAuNDIgMzYuMTA4LTM2LjA4MXoiIHN0eWxlPSJmaWxsOm5vbmU7Ii8+PHBhdGggZD0ibTMyLjkwMiA2Ny42NjJjLTAuMzYyOTUgMS43MjI3LTYuMjM0MiAzMC42OTUgNS42MTMzIDUyLjU5NiA0LjU4NDMgOC40NzQzIDkuMDA4MSAxMy4yMzkgMTIuNzUgMTUuODkzYTY3LjcgNjcuNyAwIDAgMS0zLjQ2ODgtMjEuMzUgNjcuNyA2Ny43IDAgMCAxIDIuMzMyLTE3LjY1OGMtNC40OTE0LTIuNDY0Ni0xMC44NjgtNi45MDEyLTEzLjgzNC0xMy41Mi00LjE2MjYtOS4yODUtMy42MTU1LTE0LjY3My0zLjM5MjYtMTUuOTYxem0xNjUuMTkgMGMwLjIyMjkyIDEuMjg4MiAwLjc3MDA1IDYuNjc1OS0zLjM5MjYgMTUuOTYxLTIuOTY2NCA2LjYxODMtOS4zNDI2IDExLjA1NS0xMy44MzQgMTMuNTJhNjcuNyA2Ny43IDAgMCAxIDIuMzMyIDE3LjY1OCA2Ny43IDY3LjcgMCAwIDEtMy40Njg4IDIxLjM1YzMuNzQxOS0yLjY1MzIgOC4xNjU3LTcuNDE4MyAxMi43NS0xNS44OTMgMTEuODQ3LTIxLjkgNS45NzYyLTUwLjg3MyA1LjYxMzMtNTIuNTk2eiIgc3R5bGU9ImZpbGw6I2FjZmZmZDsiLz48cGF0aCBkPSJtMTE1LjczIDEzLjE5MWMtNy4zNzg3LTAuMTMzNTEtMTMuNTA5IDUuNzg4OC0xMy42MzEgMTMuMTY4LTAuMTAxMjggNS44ODI3IDMuNDUwOCAxMC41MTggOC4wNTY2IDEyLjUyIDEuMDYxIDAuNDYxMTUgMi4xODY5IDAuNzgwMDkgMy4zNDE4IDAuOTU3MDN2OC40MjkxYzAuNjY3NzgtMC4wMjAzNSAxLjMzNTgtMC4wMzA3NyAyLjAwMzktMC4wMzEyNSAwLjY2NTQ3LTllLTUgMS4zMzA5IDAuMDA5NyAxLjk5NjEgMC4wMjkzdi04LjQxMTVjMi42MDAyLTAuMzg0MDYgNS4xNTg2LTEuNTQ4NCA3LjMwODYtMy42MjUgNC4yMzIyLTQuMDg3OCA0Ljk5OTEtOS44NzU1IDMuMTU4Mi0xNC41NDktMS44NDA3LTQuNjcyNi02LjM1MDItOC4zODM0LTEyLjIzMi04LjQ4NjN6IiBzdHlsZT0iZmlsbDojYWNmZmZkOyIvPjxwYXRoIGQ9Im0xMzMgMTA4LjE3aDE0LjE3bS02My4yNiAwaDE0LjA5bS0yMC42OS04LjkzYTIxLjMxIDIxLjMxIDAgMCAxIDI3LjI5IDBtMjEuOCAwYTIxLjMxIDIxLjMxIDAgMCAxIDI3LjI5IDAiIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS13aWR0aDo0LjgyNDNweDtzdHJva2U6IzAwMDsiLz48cGF0aCBkPSJtMTE1LjUgMTUzLjkzYTE0IDE0IDAgMCAxLTEwLjUtNC42OSAzLjQyMDkgMy40MjA5IDAgMCAxIDUtNC42N2wwLjA4IDAuMDggMC4wOCAwLjA5YTcuMzUgNy4zNSAwIDAgMCAxMC4zOSAwLjM3bDAuMzctMC4zN2EzLjQyMDYgMy40MjA2IDAgMSAxIDUuMjMgNC40MWwtMC4wOCAwLjA5YTE0IDE0IDAgMCAxLTEwLjUzIDQuNjl6IiAvPjxwYXRoIGQ9Im0xMTUuMjcgMTI3LjMyYy03LjY2MjctMC4wMy0xNS4yNTEgMS40NDE5LTIwLjY0NiA1LjE0NjUtNy42MiA1LjMzLTkuOTA1MyAxMS41MTItMTQuMTI3IDE4LjEwOS0zLjQzNzkgNS4yNDQ3LTkuMzI2IDEwLjAyNC0xMy40NjcgNi4zMzQgMjUuNDI1IDI5Ljc1NSA3MS40MDkgMjkuNzg2IDk2Ljg3NSAwLjA2NjQtNi44MTA0IDMuOTMwNS0xMS41NDUtMi40Ny0xMy41MDgtNi40MDA0LTEwLjY5Ny0xNy42MDUtMTQuMTE1LTIyLjY1Ni0zNS4xMjctMjMuMjU2em0tMC4yNjc1OCA4LjM5ODRjNy40NTcgMC4wODAyIDE0Ljk4NiAxLjI5NjYgMTcuMTQ2IDUuOTUyMiAyLjU3NjUgMTEuMzE5LTcuNTg3OCAxNy40NTQtMTYuNjgxIDE3LjUxNS02LjA5LTAuMDUtMTIuMi0yLjM4MDItMTUuMjYtNy43NDAyLTYuMzYtMTEuMTYgMy42MzQ5LTE1LjYwNyAxNC43OTUtMTUuNzI3eiIgc3R5bGU9ImZpbGw6IzAwMDsiLz48L3N2Zz4=",
//               "isAvatarImageSet": true
// }