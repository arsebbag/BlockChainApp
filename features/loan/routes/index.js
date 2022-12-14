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
//     "srcAccountId": "",
//         "destAccountId": "",
//             "amount": 5,
//                 "managerID": "",
//                     "duration": "2",
//                          "approved": 1
// }



//controllers funcs - (maybe passe it to new controllers folder/file).
const addLoan = async (req, res) => {
    let data = req.body
    // if (req.session.user.role == 'M') {
    //     //check account - amount enough to validate the loan
    // }
    if (data.srcAccountId.match(/^[0-9a-fA-F]{24}$/) && data.destAccountId.match(/^[0-9a-fA-F]{24}$/)) {
        var srcAcc = await Utils.findAccountDetails(data.srcAccountId)
        var dstAcc = await Utils.findAccountDetails(data.destAccountId)
        var srcUser = await Utils.findUserDetails(srcAcc.ownerId)
        var dstUser = await Utils.findUserDetails(dstAcc.ownerId)
    }
    if (!srcAcc || !dstAcc) {
        res.end("recipient or lenders account doesn't exist, try again!")
    }
    else {
        let lendersId = (await Account.find({ $ne: srcAcc.id }).select("_id"));
        console.log("lenders:\n", lendersId)
        /////check authorizations/////
        let getAuth = Utils.loanAutorization(srcAcc.balance, dstAcc.balance, data.amount); //verification of accounts balances

        if (!getAuth.cond) {
            errorMessage = getAuth.message;
            //res.send(getAuth.message);
        }
        //handle accounts Balances for the loan.
        Utils.addMoneyToAccount(srcAcc, data.amount)
        Utils.subMoneyfromAccount(dstAcc, data.amount)

        let newLoan = new Loan({
            srcAccountId: data.srcAccountId,
            destAccountId: data.destAccountId,
            amount: data.amount,
            dateOfLoan: Date.now(),
            duration: data.duration,
            approved: 1
        });
        // add check balance - if not - var io = io.listen(server); io.clients[sessionID].send()
        //let zeroUsers = Utils.getAllUserZero();
        await newLoan.save();
        res.send({ "message": "Loan created", "loanDetails": newLoan });
    }
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
//loan's routes
router.route("/create").post(addLoan);
router.route("/delete/:id").post(deleteLoan);
router.route("/deleteAll").get(deleteAllLoan);
router.route("/update/:id").put(updateLoan);
router.route("/getAll").get(getAllLoans);

module.exports = router

