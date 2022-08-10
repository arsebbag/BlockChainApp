const router = require("express").Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const session = require("express-session");

const Account = require("../../account/models/account")
const User = require("../../authentication/models/user");
const Loan = require("../model/loan")
const Utils = require("../../../utils/common")

let errorMessage = "";
// loan's controllers
router.route("/").post((req, res, next) => {
    res.send("in Loan route")
});

//CREATE LOAN 
// {
//     "srcAccountId": "62ecde84c444f977b9bc2ec8",
//         "destAccountId": "62ecdeaac444f977b9bc2ecc",
//             "amount": "10",
//                 "managerID": "111",
//                     "dateOfLoan": "",
//                         "duration": "2"
// }
//controllers funcs - (maybe passe it to new controllers folder/file).
const addLoan = async (req, res) => {
    let data = req.body
    // if (req.session.user.role == 'M') {
    //     //check account - amount enough to validate the loan
    // }

    let srcAcc = await Utils.findAccountDetails(data.srcAccountId).catch(() => srcAcc = null)
    let dstAcc = await Utils.findAccountDetails(data.destAccountId).catch(() => dstAcc = null)

    let srcUser = await Utils.findUserDetails(srcAcc.ownerId).catch(() => srcUser = null)
    let dstUser = await Utils.findUserDetails(dstAcc.ownerId).catch(() => dstUser = null)
    let pickLoanDest = Account.find({ $ne: srcAcc.id })
    console.log(pickLoanDest)
    if (!srcAcc) {
        res.send("source account doesn't exist, try again!")
    }
    else if (!dstAcc) {
        res.send("recipient account doesn't exist, try again!")
    }
    /////check authorizations/////
    let getAuth = Utils.loanAutorization(srcAcc.balance, dstAcc.balance, data.amount); //verification of accounts balances

    if (!getAuth.cond) {
        errorMessage = getAuth.message;
        //res.send(getAuth.message);
    }
    //handle accounts Balances for the loan.
    Utils.addMoneyToAccount(dstAcc, data.amount)
    Utils.subMoneyfromAccount(srcAcc, data.amount)

    
    let newLoan = new Loan({
        srcAccountId: data.srcAccountId,
        destAccountId: data.destAccountId,
        amount: data.amount,
        dateOfLoan: Date.now(),
        duration: data.duration,
        approved:1
    });
    // add check balance - if not - var io = io.listen(server); io.clients[sessionID].send()
    //let zeroUsers = Utils.getAllUserZero();
    await newLoan.save();
    res.send({ "message": "Loan created", "loanDetails": newLoan });

}

const deleteLoan = async (req, res) => {
    //need to check if the session is a admin 
    const id = req.params.id.slice(1);
    const tran = await Loan.findByIdAndRemove(id).exec(function (err, item) {
        if (err) {
            return res.json({ success: false, msg: 'Cannot remove item' });
        }
        if (!item) {
            return res.status(404).json({ success: false, msg: 'Loan not found' });
        }
        res.json({ success: true, msg: 'Loan deleted.' });
    });
}

const deleteAllLoan = async (req, res) => {
    try {
        await Loan.remove({})
    } catch (error) { res.status(400).send(error.message); }
    res.send("All loans deleted");
}

const updateLoan = async (req, res) => {
    try {
        const id = req.params._id.slice(1);
        const data = req.body;
        const uLoan = await Loan.findOneAndUpdate({ _id: id }, {
            srcAccountId: data.srcAccountId,
            destAccountId: data.destAccountId,
            amount: data.amount,
            duration: data.duration
        }, { new: true });
    } catch (error) {
        res.status(400).send(error.message);
    }
    console.log("1 document updated");
    res.send("ok");
}

const getAllLoans = async (req, res) => {
    Loan.find()
        .then((loan) => res.json(loan))
        .catch((err) => res.status(400).json("Error: " + err));
}

//loan's routes
router.route("/create").post(addLoan);
router.route("/delete/:id").post(deleteLoan);
router.route("/deleteAll").get(deleteAllLoan);
router.route("/update/:id").put(updateLoan);
router.route("/getAll").get(getAllLoans);

module.exports = router

