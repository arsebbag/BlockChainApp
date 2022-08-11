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

//login
// {
//   "username": "ariel123",
//     "password": "12345678"
// }

//TODO: change to middleware
async function ListRoleNull() {
  return await User.find({ role: null })
}

router.route("/login").post(async (req, res, next) => {
  await passport.authenticate("local", (err, user, info) => {
    if (err) throw err;
    if (!user) res.send("No user exists");
    else {
      req.logIn(user, async (err) => {
        if (err) throw err;
        let sessUser = await User.findOne({ username: req.body.username })//.exec().catch(() => sessUser = null)
        let account = await Account.findOne({ ownerId: sessUser.id })//.exec().catch(() => account = null)
        let allNullRoleUsers = await ListRoleNull();

        if (sessUser.role == 'M')// Manager
        {
          res.send({ message: "Manager authenticated", userDetails: sessUser, accountDetails: account, nullRole: allNullRoleUsers })//account.$assertPopulated
        } else if (sessUser.role == 'B') {

          res.send({ message: "Basic user authenticated", userDetails: sessUser, accountDetails: account })
        }
        else if (sessUser.role == null) {
          res.send({ message: "Authentification failed - manager need to aprove this account" });
        }
        else {
          res.send({ message: "Authentification failed" });
        }
      });
    }
  })(req, res, next);
});

// register
// {
//   "firstName": "ariel1",
//     "lastName": "sebbag1",
//       "birthday": "19.03.95",
//         "email": "as1903@gmail.com",
//           "phone": "0545965548",
//             "username": "ariel123",
//               "password": "12345678"

// }

router.route("/register").post((req, res) => {

  User.findOne({ username: req.body.username }, async (err, doc) => {
    if (err) throw err;
    if (doc) return res.send("User already exists");
    let data = req.body
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = new User({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      birthday: data.birthday,
      phone: data.phone,
      username: data.username,
      password: hashedPassword,
      role: data.role == 'M' ? 'M' : null, //null
      message: data.message
    });

    await newUser.save();
    res.send("User created");

  });
});

// get request route
router.route("/").get(async (req, res) => {
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
    res.json({ success: true, msg: 'user deleted.', userLeft: `there are ${userCount} left` });
  });
}

const removeAllUsers = (async (req, res) => {
  try {
    await User.remove({});
  } catch (error) { res.status(400).send(error.message); }
  res.send("All users hase been deleted successfully");
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
//   "_id": "62f41fee891162053b362076",
//     "firstName": "ariel1",
//       "lastName": "sebbag1",
//         "birthday": "19.03.95",
//           "email": "as1903@gmail.com",
//             "phone": "0545965548",
//               "username": "ariel123",
//                 "password": "$2a$10$pWsNNiGXU/pWnJHBNEkp8eDsQ/QCauT.xvtLOJnPpVAxzMXuAm1TO",
//                   "role": "B"
// }

// {
//   "_id": "62ebe0f9bc7cba1861fc0d3f",
//     "username": " Hillel",
//       "password": "$2a$10$FaYzD6gCVFX24LlmsqWo6.TvzvdVhIAMWJQtDsaFfj1Qn9YoCLL5q",
//         "role": "B",
//            "firstName": "ariel1",
//                  "lastName": "sebbag1",
//                    "birthday": "19.03.95",
//                      "email": "as1903@gmail.com",
//                        "phone": "0545965548",
//                          "avatarImage": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzEgMjMxIj48cGF0aCBkPSJNMzMuODMsMzMuODNhMTE1LjUsMTE1LjUsMCwxLDEsMCwxNjMuMzQsMTE1LjQ5LDExNS40OSwwLDAsMSwwLTE2My4zNFoiIHN0eWxlPSJmaWxsOiMwREMxNUM7Ii8+PHBhdGggZD0ibTExNS41IDUxLjc1YTYzLjc1IDYzLjc1IDAgMCAwLTEwLjUgMTI2LjYzdjE0LjA5YTExNS41IDExNS41IDAgMCAwLTUzLjcyOSAxOS4wMjcgMTE1LjUgMTE1LjUgMCAwIDAgMTI4LjQ2IDAgMTE1LjUgMTE1LjUgMCAwIDAtNTMuNzI5LTE5LjAyOXYtMTQuMDg0YTYzLjc1IDYzLjc1IDAgMCAwIDUzLjI1LTYyLjg4MSA2My43NSA2My43NSAwIDAgMC02My42NS02My43NSA2My43NSA2My43NSAwIDAgMC0wLjA5OTYxIDB6IiBzdHlsZT0iZmlsbDojYzU3YjE0OyIvPjxwYXRoIGQ9Im0xMTUuNSAyMzFhMTE1IDExNSAwIDAgMCA2NC4yMy0xOS41IDExNC43OSAxMTQuNzkgMCAwIDAtMzgtMTYuNWwtMi40MS05YTEyNS4xOSAxMjUuMTkgMCAwIDAtMTMuMzItMi4yOHY4Ljc1cTMuNTIgMC4zMiA3IDAuODRsLTE3LjUgMTcuNDgtMTcuNS0xNy40OHEzLjQ1LTAuNTIgNy0wLjg0di04Ljc1YTEyNS41NSAxMjUuNTUgMCAwIDAtMTMuMzQgMi4yOGwtMi40MSA5YTExNC43OSAxMTQuNzkgMCAwIDAtMzggMTYuNSAxMTQuOTQgMTE0Ljk0IDAgMCAwIDY0LjI1IDE5LjV6IiBzdHlsZT0iZmlsbDojMDAwOyIvPjxwYXRoIGQ9Im0xMzIuOTggMTkzLjMzLTM2LjE4NSAzNi4xNTUtMi40LTAuNDIgMzYuMTA4LTM2LjA4MXoiIHN0eWxlPSJmaWxsOm5vbmU7Ii8+PHBhdGggZD0ibTMyLjkwMiA2Ny42NjJjLTAuMzYyOTUgMS43MjI3LTYuMjM0MiAzMC42OTUgNS42MTMzIDUyLjU5NiA0LjU4NDMgOC40NzQzIDkuMDA4MSAxMy4yMzkgMTIuNzUgMTUuODkzYTY3LjcgNjcuNyAwIDAgMS0zLjQ2ODgtMjEuMzUgNjcuNyA2Ny43IDAgMCAxIDIuMzMyLTE3LjY1OGMtNC40OTE0LTIuNDY0Ni0xMC44NjgtNi45MDEyLTEzLjgzNC0xMy41Mi00LjE2MjYtOS4yODUtMy42MTU1LTE0LjY3My0zLjM5MjYtMTUuOTYxem0xNjUuMTkgMGMwLjIyMjkyIDEuMjg4MiAwLjc3MDA1IDYuNjc1OS0zLjM5MjYgMTUuOTYxLTIuOTY2NCA2LjYxODMtOS4zNDI2IDExLjA1NS0xMy44MzQgMTMuNTJhNjcuNyA2Ny43IDAgMCAxIDIuMzMyIDE3LjY1OCA2Ny43IDY3LjcgMCAwIDEtMy40Njg4IDIxLjM1YzMuNzQxOS0yLjY1MzIgOC4xNjU3LTcuNDE4MyAxMi43NS0xNS44OTMgMTEuODQ3LTIxLjkgNS45NzYyLTUwLjg3MyA1LjYxMzMtNTIuNTk2eiIgc3R5bGU9ImZpbGw6I2FjZmZmZDsiLz48cGF0aCBkPSJtMTE1LjczIDEzLjE5MWMtNy4zNzg3LTAuMTMzNTEtMTMuNTA5IDUuNzg4OC0xMy42MzEgMTMuMTY4LTAuMTAxMjggNS44ODI3IDMuNDUwOCAxMC41MTggOC4wNTY2IDEyLjUyIDEuMDYxIDAuNDYxMTUgMi4xODY5IDAuNzgwMDkgMy4zNDE4IDAuOTU3MDN2OC40MjkxYzAuNjY3NzgtMC4wMjAzNSAxLjMzNTgtMC4wMzA3NyAyLjAwMzktMC4wMzEyNSAwLjY2NTQ3LTllLTUgMS4zMzA5IDAuMDA5NyAxLjk5NjEgMC4wMjkzdi04LjQxMTVjMi42MDAyLTAuMzg0MDYgNS4xNTg2LTEuNTQ4NCA3LjMwODYtMy42MjUgNC4yMzIyLTQuMDg3OCA0Ljk5OTEtOS44NzU1IDMuMTU4Mi0xNC41NDktMS44NDA3LTQuNjcyNi02LjM1MDItOC4zODM0LTEyLjIzMi04LjQ4NjN6IiBzdHlsZT0iZmlsbDojYWNmZmZkOyIvPjxwYXRoIGQ9Im0xMzMgMTA4LjE3aDE0LjE3bS02My4yNiAwaDE0LjA5bS0yMC42OS04LjkzYTIxLjMxIDIxLjMxIDAgMCAxIDI3LjI5IDBtMjEuOCAwYTIxLjMxIDIxLjMxIDAgMCAxIDI3LjI5IDAiIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS13aWR0aDo0LjgyNDNweDtzdHJva2U6IzAwMDsiLz48cGF0aCBkPSJtMTE1LjUgMTUzLjkzYTE0IDE0IDAgMCAxLTEwLjUtNC42OSAzLjQyMDkgMy40MjA5IDAgMCAxIDUtNC42N2wwLjA4IDAuMDggMC4wOCAwLjA5YTcuMzUgNy4zNSAwIDAgMCAxMC4zOSAwLjM3bDAuMzctMC4zN2EzLjQyMDYgMy40MjA2IDAgMSAxIDUuMjMgNC40MWwtMC4wOCAwLjA5YTE0IDE0IDAgMCAxLTEwLjUzIDQuNjl6IiAvPjxwYXRoIGQ9Im0xMTUuMjcgMTI3LjMyYy03LjY2MjctMC4wMy0xNS4yNTEgMS40NDE5LTIwLjY0NiA1LjE0NjUtNy42MiA1LjMzLTkuOTA1MyAxMS41MTItMTQuMTI3IDE4LjEwOS0zLjQzNzkgNS4yNDQ3LTkuMzI2IDEwLjAyNC0xMy40NjcgNi4zMzQgMjUuNDI1IDI5Ljc1NSA3MS40MDkgMjkuNzg2IDk2Ljg3NSAwLjA2NjQtNi44MTA0IDMuOTMwNS0xMS41NDUtMi40Ny0xMy41MDgtNi40MDA0LTEwLjY5Ny0xNy42MDUtMTQuMTE1LTIyLjY1Ni0zNS4xMjctMjMuMjU2em0tMC4yNjc1OCA4LjM5ODRjNy40NTcgMC4wODAyIDE0Ljk4NiAxLjI5NjYgMTcuMTQ2IDUuOTUyMiAyLjU3NjUgMTEuMzE5LTcuNTg3OCAxNy40NTQtMTYuNjgxIDE3LjUxNS02LjA5LTAuMDUtMTIuMi0yLjM4MDItMTUuMjYtNy43NDAyLTYuMzYtMTEuMTYgMy42MzQ5LTE1LjYwNyAxNC43OTUtMTUuNzI3eiIgc3R5bGU9ImZpbGw6IzAwMDsiLz48L3N2Zz4=",
//                            "isAvatarImageSet": true
// }




// "_id": "62f36bf8277f920486209483",
//   "username": "tryNew",
//     "password": "$2a$10$8MPwP1EEtacIXmHTj/K6U.6/K.71FNWGv4BIiy4652zHSZAqvDxo2",
//       "role": "B",
//         "avatarImage": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzEgMjMxIj48cGF0aCBkPSJNMzMuODMsMzMuODNhMTE1LjUsMTE1LjUsMCwxLDEsMCwxNjMuMzQsMTE1LjQ5LDExNS40OSwwLDAsMSwwLTE2My4zNFoiIHN0eWxlPSJmaWxsOiNFNkMxMTc7Ii8+PHBhdGggZD0ibTExNS41IDUxLjc1YTYzLjc1IDYzLjc1IDAgMCAwLTEwLjUgMTI2LjYzdjE0LjA5YTExNS41IDExNS41IDAgMCAwLTUzLjcyOSAxOS4wMjcgMTE1LjUgMTE1LjUgMCAwIDAgMTI4LjQ2IDAgMTE1LjUgMTE1LjUgMCAwIDAtNTMuNzI5LTE5LjAyOXYtMTQuMDg0YTYzLjc1IDYzLjc1IDAgMCAwIDUzLjI1LTYyLjg4MSA2My43NSA2My43NSAwIDAgMC02My42NS02My43NSA2My43NSA2My43NSAwIDAgMC0wLjA5OTYxIDB6IiBzdHlsZT0iZmlsbDojY2E4NjI4OyIvPjxwYXRoIGQ9Im0xNDEuNzUgMTk1YTExNC43OSAxMTQuNzkgMCAwIDEgMzggMTYuNSAxMTUuNTMgMTE1LjUzIDAgMCAxLTEyOC40NiAwIDExNC43OSAxMTQuNzkgMCAwIDEgMzgtMTYuNWwyNi4yMyAxMyAyNi4yNy0xM3oiIHN0eWxlPSJmaWxsOiNENjdEMUI7Ii8+PHBvbHlnb24gcG9pbnRzPSIxMTUuNSAyMDguMDMgMTE1LjUgMjA3Ljc0IDgyLjcyIDE4OC45MSA4MC40NSAxOTguODYgMTAxLjQ2IDIyMi43MiIgc3R5bGU9ImZpbGw6I2I4ZDBlMDsiLz48cG9seWdvbiBwb2ludHM9IjExNS41IDIwOC4wMyAxMTUuNSAyMDcuNzQgMTQ4LjI4IDE4OC45MSAxNTAuNTUgMTk4Ljg2IDEyOS41NCAyMjIuNzIiIHN0eWxlPSJmaWxsOiNiOGQwZTA7Ii8+PHBhdGggZD0ibTQxLjY2OCA4Ny4wNzNjLTkuMjMxOS0wLjAyMzEtMTEuNjMgNi41MTA0IDIuMjY3NiAxNy42Ni0xNC4wMTUgMS4xMjMxLTQuMzY2MiAxNi40NTcgNC44NzUgMjQuNjYgNC4wNjg2IDMuMDE5OSA2LjQ2NDcgNS40NjU3IDUuNTA3OCAxLjEzNDgtMS4yMDc5LTQuOTE3OC0xLjgxODQtOS45NjM0LTEuODE4NC0xNS4wMjcgMy4yNmUtNCAtNy41NjkyIDEuMjU0Ny0xNS4wMTYgMy43ODgzLTIyLjE4MyAwLjU3MDQ4LTEuNzg3NiAxLjA2ODktMi4wMzA2LTAuMzc3MjEtMi42ODM5LTUuNTQwNS0yLjQ0NzgtMTAuMzc1LTMuNTUxMS0xNC4yNDMtMy41NjA4eiIgc3R5bGU9ImZpbGw6I2ZmZjsiLz48cGF0aCBkPSJtMTg1LjQ4IDg5LjUxM2MtMi40NDE4LTAuMTExODktNS40NjE4IDAuODExODctOS41MTQ4IDMuMjEyMS0xLjMxNCAwLjgxNzI5LTAuNzAwNzUgMS45OTUtMC4zMjMwMSAzLjI2NTMgMy4xOTQgMTAuOTgyIDMuODIxNSAyMi40NjIgMS4yNTM4IDMzLjYyOC0wLjMxNjEzIDEuNjg4LTAuNDc2NDkgMy41NjkgMi42OTUzIDEuMzUxNiA3LjcwMTYtNS4zNzEgMTkuMTctMTguNzM0IDE2LjkxOC0yNi4xMDUtMS40MjUxLTMuOTE3Ny0xMS40LTAuMzU1NDYtMTEuNC0wLjM1NTQ2czQuOTg3LTQuMjc1NSA1LjM0MzctOS42MTkxYzAuMjAwNDgtMy4wMDU3LTEuNTIzNy01LjIxODktNC45NzI2LTUuMzc3eiIgc3R5bGU9ImZpbGw6I2ZmZjsiLz48cGF0aCBkPSJtOTEuNjg5IDM2LjEwOGMtMy43Mjk4LTcuMzg2NC05LjU4NTktMTAuNTA0LTE3LjU3OC02Ljc4OTEtOS41MTk0IDQuNTkwNy0xNS42MjkgMTguNDQ0LTEzLjQxNiAyOS4yMzIgMCAwLTguNTUxMS00Ljk4NzgtMTguMTctMy41NjI1LTE5LjYyMyA4LjA5NC0xLjQxMDIgMjkuODY5IDEwLjgxNyAzNy4zNDIgMi4wNzUgMS4yOTcgMi41NzkyIDEuNzQzMiAzLjQyOTEtMC4zNzY4NSAyLjY3NDYtNi41Mzc0IDYuMTg4Ni0xMi43MjIgMTEuMjk3LTE3LjcwOSA0LjEwMzkgOC43NDI3IDE0LjYyOSA0LjE4MDkgMjAuMDA2LTAuMTQwNjIgNC40ODczIDkuNjgzOCAxMC4zNzcgNi4zNTM1IDE1LjM3NyAzLjQ3ODUgNC4wNzY0IDcuODgyOSAxMC43NTYgNy4yNSAxNy42MzEgMC4wNjI1IDQuODc1IDQuNTYyNSAxNC43MTMgNC4xODY3IDE1LjU1NS0zLjQyNiA4LjQ3NTMgMi42MjQ0IDE0LjAxMiAxMC40MzcgMjIuOTYyLTEuNDc2NCA4Ljg1NTIgNi44MjIxIDE0LjQwNyAxNi44NTMgMTcuMTIyIDI3LjUxIDAuMzQgMS41NTQgMS4xNzUgMC44NTU2NSAyLjIyMTIgMC40NDMxNSAxMC4yNTUtNC4yODYgMjIuODQyLTE1Ljc0OSAxNS43MDUtMjMuOTc1LTMuNTYyMy0zLjU2MjMtMTMuNTM5LTIuMTM4Ny0xMy41MzktMi4xMzg3czYuNzctNy4xMjMzIDkuMjYzNy0xOC4xNjhjMi40OTM2LTExLjA0My0yMy41MTQtNC45ODgzLTIzLjUxNC00Ljk4ODNzNy40ODE4LTUuNjk5MyAxMi4xMTMtMTMuNTM3YzQuNjMxNC03LjgzNzgtMi40OTQzLTExLjc1Ni0xMS4wNDUtMTEuMDQzLTguNTQ5NiAwLjcxMjA0LTE3LjEgNy40ODA1LTE3LjEgNy40ODA1czMuMzk0Ni03LjgwNTUtMy41NjI1LTEyLjgyNmMtOS41OTM1LTYuOTIzNC0yMy44NjkgNi40MTIxLTIzLjg2OSA2LjQxMjEtNC4yNTYyLTI2LjgzNS0yNC44NzItNi4zODYtMzEuNzA3IDguMTk1M3oiIHN0eWxlPSJmaWxsOm5vbmU7Ii8+PHBhdGggZD0ibTEzMS42NCAxMTQuMDkgNy41ODAxLTcuNTgwMSA3LjU4MDEgNy41ODAxbS02Mi42IDAgNy41ODAxLTcuNTgwMSA3LjU3OTkgNy41ODAxIiBzdHlsZT0iZmlsbDpub25lO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2Utd2lkdGg6Ni40OTk4cHg7c3Ryb2tlOiMwMDA7Ii8+PHBhdGggZD0ibTEyMy4wNyAxNTQuMDVhMTAuNjEgMTAuNjEgMCAwIDEtMTUgMC4xNGwtMC4xNC0wLjE0IiBzdHlsZT0iZmlsbDpub25lO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2Utd2lkdGg6Ni4zcHg7c3Ryb2tlOiMwMDA7Ii8+PHBhdGggZD0ibTEyMC4xIDE0Mi4yMiAwLjE5LTAuMTFjMy0xLjg3IDUuNDUtMi40IDcuMy0xLjQ2IDIuMTUgMS4xIDMuMTIgMy44NCA0Ljg0IDUuNWE1LjE4IDUuMTggMCAwIDAgNi42OCAwLjczbS0yOC4yMS00LjY2LTAuMTktMC4xMWMtMy0xLjg3LTUuNDUtMi40LTcuMy0xLjQ2LTIuMTUgMS4xLTMuMTIgMy44NC00Ljg0IDUuNWE1LjE4IDUuMTggMCAwIDEtNi42OCAwLjczIiBzdHlsZT0iZmlsbDpub25lO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2Utd2lkdGg6NS45OTk4cHg7c3Ryb2tlOiM0ZDRkNGQ7Ii8+PC9zdmc+",
//           "isAvatarImageSet": true
// 	}