const router = require("express").Router();

const bcrypt = require("bcryptjs");
const passport = require("passport");
const session = require("express-session");

const User = require("../../authentication/models/user");
const Transaction = require("../models/transactions");
const BlockChain = require("../../../BlockChain/BlockChain");
const Utils = require("../../../utils/common");
const Block = require("../../../BlockChain/Block");
const mongoose = require("mongoose")

const { Server } = require("socket.io")

// {

//     "data": {
//         "srcAccountId": "62f2c3f2e49a84703226e85d",
//             "destAccountId": "62f372f7277f9204862094b1", "amount": 1
//     }
// }	

//Transaction's controller
const addTransaction = async (req, res) => {
    const Data = req.body;
    let srcAcc = await Utils.findAccountDetails(Data.data.srcAccountId)
    let dstAcc = await Utils.findAccountDetails(Data.data.destAccountId)

    //first check and after fill and save in database
    let getAuth = Utils.transactionAutorization(srcAcc.balance, dstAcc.balance, Data.data.amount); //verification of accounts balances
    if (!getAuth.cond) {
        res.send(getAuth.message);
    }
    else if (!Utils.checkBalance(Data.data.srcAccountId)) {
        // var io = io.listen(server);
        // io.clients[sessionID].send()
        res.send("Transaction unauthorized - source account don't have enough money for this transaction");
    }
    
    Utils.addMoneyToAccount(dstAcc, Data.data.amount)
    Utils.subMoneyfromAccount(srcAcc, Data.data.amount)
    
    let newTran = new Transaction({ //need to change here
        id: Data.id,
        // thisHash: Data.thisHash, - TODO:  with new Block() before!!
        // prevHash: Data.prevHash,
        data: Data.data,
        dateOfTrans: Date.now()
    });
    console.log(newTran)
    console.log(typeof newTran)
    let block = new Block(newTran);
    // if (req.session.user.role != 'M') {
    //     res.send("Need to get autorization from manager")
    // }
    let zeroUsers = Utils.getAllUserZero();
    await newTran.save();
    res.send({ "message": "Transaction created", "transactionDetails": newTran });
}

const deleteTransaction = async (req, res) => {
    const id = req.params.id.slice(1);
    const tran = await Transaction.findByIdAndRemove(id).exec(function (err, item) {
        if (err) {
            return res.json({ success: false, msg: 'Cannot remove item' });
        }
        if (!item) {
            return res.status(404).json({ success: false, msg: 'Transaction not found' });
        }
        res.json({ success: true, msg: 'Transaction deleted.' });
    });

}

const updateTransaction = async (req, res) => {
    try {
        const id = req.params.id.slice(1);
        const Data = req.body;

        await Transaction.findOneAndUpdate({ _id: id }, {
            data: { srcAccountId: Data.data.srcAccountId, destAccountId: Data.data.destAccountId, amount: Data.data.amount }//srcAccountId: Data.data.srcAccountId, destAccountId: Data.data.destAccountId, amount: Data.data.amount
        }, { new: true });
    } catch (error) {
        res.status(400).send(error.message);
    }
    console.log("1 document updated");
    res.send("1 document updated");
}

const getTransactions = async (req, res) => {
    Transaction.find()
        .then((tran) => res.json(tran))
        .catch((err) => res.status(400).json("Error: " + err));
}

const getOneTransaction = async (req, res) => {
    const id = req.params.id.slice(1);
    Transaction.findById({ _id: id })
        .then((tran) => res.json(tran))
        .catch((err) => res.status(400).json("Error: " + err));
}

const deleteAllTran = async (req, res) => {
    //need to check if the session is a admin 
    try {
        await Transaction.remove({})
    } catch (error) { res.status(400).send(error.message); }
    res.send("All transactions deleted");
}

router.route("/create").post(addTransaction);
router.route("/delete/:id").get(deleteTransaction);
router.route("/getAll").get(getTransactions);
router.route("/update/:id").put(updateTransaction);
router.route("/getOne/:id").get(getOneTransaction);
router.route("/deleteAll").get(deleteAllTran);


module.exports = router

/* should be in db
{
"data": {
    "srcAccountId": "",
        "destAccountId": "",
            "amount": 5
},
"_id": "62f18e1adea9bfedb0970d00",
    "thisHash": "99999",
        "prevHash": "22222",
            "dateOfTrans": "2022-08-08T22:28:42.419Z",
                "__v": 0
	},
*/