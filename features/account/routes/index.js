const router = require("express").Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const session = require("express-session");

const User = require("../../authentication/models/user");
const Account = require("../models/account")
const Exchange = require("../../api/routes/moneyExchange")
const Utils = require("../../../utils/common")
// encrypt the session details.
// router.use(
//     session({
//         secret: "secretcode",
//         resave: true,
//         saveUninitialized: true,
//     })
// );
// router.use(passport.session());

//Account controllers
router.route("/").get((req, res, next) => {
    res.send("in account routes")
});

router.route("/create").post(async (req, res) => {
    try {

        // {
        //     "ownerId": "",
        //         "balance": 2,
        //             "managerId": ""
        // }

        const data = req.body;
        if (!data.ownerId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.send(`${data.ownerId} id - have a bad format!`)
        }
        let user = await Utils.findUserDetails(data.ownerId);
        //check if user exist
        if (user == null) {
            return res.send(`user ID - ${data.ownerId} doesn't exist, can't create this account!`)
        }
        //check if this user have already an account
        let accountsCount = await CountUserID(data.ownerId);
        if (accountsCount) {
            return res.send(`user ${user.username}, no. ${data.ownerId} already have an account!`);
        } //else {
        //notif
        await Utils.updateUserRole(user.id, 'B')
        let newAccount = new Account({
            ownerId: data.ownerId,
            balance: data.balance,// - not need it if the manager give money + create func addMoneyToAccount()
            managerId: data.managerId
        });
        await newAccount.save();

        Exchange.updateLevCoinValue(newAccount.balance)
        return res.send({ "message": "Account created", "accountDetails": newAccount });
        //  }
    } catch (err) {
        console.log(err)// res.send(err)
    }

});
// count if this user exist and how match account
async function CountUserID(userId) {
    return await Account.countDocuments({ ownerId: userId });
}


const updateAccount = async (req, res) => {
    try {
        const id = req.params.id.slice(1);
        const data = req.body
        let result = await Utils.updateAccountDetails(id, data.balance, data.managerId)
        res.send(result)
    } catch (err) {
        res.send(err)
    }
}

const deleteAccount = async (req, res) => {
    //TODO: need to check if the session is a admin 
    const id = req.params.id.slice(1);
    const tran = await Account.findByIdAndRemove(id).exec(function (err, item) {
        if (err) {
            return res.json({ success: false, msg: 'Cannot remove item' });
        }
        if (!item) {
            return res.status(404).json({ success: false, msg: 'Account not found' });
        }
        return res.json({ success: true, msg: 'Account deleted.' });
    });
}

const getAllAccounts = async (req, res) => {

    Account.find()
        .then((account) => res.json(account))
        .catch((err) => res.status(400).json("Error: " + err));
}

//not working TODO try again
const deleteAllAccounts = async (req, res) => {
    try {
        await Account.remove({})
    } catch (error) { res.status(400).send(error.message); }
    res.send("All Accounts deleted");
}


//Extra controllers

const balanceZero = async (req, res) => {
    let zero = await Utils.getAllUserZero()
    res.send(zero)
}

const exchangeRates = async (req, res) => {
    let amountToChange = req.body.amount
    return res.send(await Exchange.getAllBalanceCurrencies(amountToChange))
}
//Account routes 

router.route("/getAll").get(getAllAccounts);
router.route("/delete/:id").get(deleteAccount);
router.route("/deleteAll").get(deleteAllAccounts);
router.route("/update/:id").put(updateAccount);
router.route("/zero").get(balanceZero);
router.route("/exchange").post(exchangeRates);


module.exports = router//, {getAllBalanceCurrencies}

