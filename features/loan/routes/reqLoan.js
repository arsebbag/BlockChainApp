const router = require("express").Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const session = require("express-session");

const Account = require("../../account/models/account")
const User = require("../../authentication/models/user");
const requestLoan = require("../model/reqLoan")
const Utils = require("../../../utils/common")

// loan's controllers
router.route("/").post((req, res, next) => {
    res.send("in Loan route")
});

//CREATE LOAN 
// {
//     "srcAccountId": "62ecde84c444f977b9bc2ec8",
//         "destAccountId": "62ecdeaac444f977b9bc2ecc",
//             "amount": "10",
//                
//                     "dateOfLoan": "",
//                         "duration": "2"
// }
//controllers funcs - (maybe passe it to new controllers folder/file).
const addReqLoan = async (req, res) => {
    let data = req.body
    // if (req.session.user.role == 'M') {
    //     //check account - amount enough to validate the loan
    // }

    let srcAcc = await Utils.findAccountDetails(data.srcAccountId).catch(() => srcAcc = null)
    let dstAcc = await Utils.findAccountDetails(data.destAccountId).catch(() => dstAcc = null)

    let srcUser = await Utils.findUserDetails(srcAcc.ownerId).catch(() => srcUser = null)
    let dstUser = await Utils.findUserDetails(dstAcc.ownerId).catch(() => dstUser = null)

    if (!srcAcc) {
        res.send("source account doesn't exist, try again!")
    }
    if (!dstAcc) {
        res.send("destination account doesn't exist, try again!")
    }
    /////check authorizations/////
    let getAuth = Utils.loanAutorization(srcAcc.balance, dstAcc.balance, data.amount); //verification of accounts balances

    if (!getAuth.cond) {
        res.send(getAuth.message);
    }

    let newLoan = new requestLoan({
        srcAccountId: data.srcAccountId,
        destAccountId: data.destAccountId,
        amount: data.amount,
        duration: data.duration,
        approved: 0
    });
    // add check balance - if not - var io = io.listen(server); io.clients[sessionID].send()
    //let zeroUsers = Utils.getAllUserZero();
    await newLoan.save();
    res.send({ "message": "New Requested Loan created", "loanDetails": newLoan });

}

const deleteLoan = async (req, res) => {
    //need to check if the session is a admin 
    const id = req.params.id.slice(1);
    const tran = await requestLoan.findByIdAndRemove(id).exec(function (err, item) {
        if (err) {
            return res.json({ success: false, msg: 'Cannot remove item' });
        }
        if (!item) {
            return res.status(404).json({ success: false, msg: 'Loan not found' });
        }
        res.json({ success: true, msg: 'Requested loan deleted.' });
    });
}

const getAllLoans = async (req, res) => {
    requestLoan.find()
        .then((loan) => res.json(loan))
        .catch((err) => res.status(400).json("Error: " + err));
}

//loan's routes
router.route("/create").post(addReqLoan);
router.route("/delete/:id").post(deleteLoan);
router.route("/getAll").get(getAllLoans);

module.exports = router

