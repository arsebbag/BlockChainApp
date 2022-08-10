
//moved to API
// var LEVCOIN = 5; // 1 LevCoin is equals to 5 dollars
// var countLevCoin = 0;

// function buyLevCoin(num) {
//     countLevCoin += num;
//     LEVCOIN = Math.ceil(LEVCOIN - (LEVCOIN/1000 + countLevCoin))
// }
const Account = require("../features/account/models/account")
const User = require("../features/authentication/models/user")
//const mongoose = require('mongoose')

////#region - times.
function getCurrentDateTime() {
    return getStringFromDateTime(new Date());
}

function getCurrentDate() {
    return getStringFromDate(new Date());
}

function getStringFromDateTime(dateobj) {
    return getStringFromTime(dateobj) + " " + getStringFromDate(dateobj);
}

function getStringFromDate(dateobj) {
    return dateobj.getDate().toString().padStart(2, '0') +
        "/" +
        (dateobj.getMonth() + 1).toString().padStart(2, '0') +
        "/" +
        dateobj.getFullYear();
}

function getStringFromTime(dateobj) {
    return dateobj.getHours().toString().padStart(2, '0') + ":" +
        dateobj.getMinutes().toString().padStart(2, '0');
}

function getDateTimeFromString(dateStr) {
    let splitDate = dateStr.split(" ");
    let time = splitDate[0];
    let date = splitDate[1].split("/");
    return Date.parse(`${time} ${date[1]}/${date[0]}/${date[2]}`);
}

function getDateFromString(dateStr) {
    let splitDate = dateStr.split("/");
    return new Date(`${splitDate[2]}/${splitDate[1]}/${splitDate[0]}`);
}
////#endregion - times.

////#region- Accounts functions
function isManager(user) {
    return user.role == "M";
}
async function findAccountDetails(accountId) {
    return Account.findById(accountId).then(res => {
        return res;
    }).catch(err => {
        console.log(err)
    })
}

//maybe not need it
async function checkBalance(accountId) {
    let balance = (await Account.findById(accountId)).balance;
    if (balance > 0)
        return true;
    else
        return false;
}

async function addMoneyToAccount(account, amount) {
    let newB = account.balance + amount //maybe put all the money in LevCoin
    updateAccountDetails(account.id, newB, account.managerId)
}

async function subMoneyfromAccount(account, amount) {
    let newB = account.balance - amount// if <= 0 need to create event to manager
    updateAccountDetails(account.id, newB, account.managerId)
}

async function updateAccountDetails(accountId, newBalance, newManager) {
    try {
        await Account.findOneAndUpdate({ _id: accountId }, {
            balance: newBalance,
            managerId: newManager,
        }, { new: true });
    } catch (error) {
        return error
    }
    return "1 document updated"
}
async function updateUserRole(userId, newRole) {
    try {
        await User.findOneAndUpdate({ _id: userId }, {
            role: newRole,
        }, { new: true });
    } catch (error) {
        return error
    }
    return "1 document updated"
}
////#endregion - accounts.

//#region - user's functions 
async function getAllUserZero() {
    let accounts = await Account.find({ "balance": { $lte: 0 } }).distinct('ownerId');// get all accountIds with balance = 0.
    console.log(accounts)
    let users = await User.find({ "_id": { $in: accounts } });
    console.log(users)
    return users;
}

async function findUserDetails(userId) {
    return await User.findById(userId)//{ id: userId }
}
////#endregion - users.

////#region - Transaction's functions////
function transactionAutorization(srcBalance, dstBalance, amount) {
    //need to check: balance srAcccount have enough monney 
    if (amount <= 0)//not autorized
    {
        return { "cond": 0, "message": "ERROR - amount need to be greater than zero!" };
    }
    else if (srcBalance < amount)//not autorized
    {
        return { "cond": 0, "message": "Source account not have enough money for this transaction amount" };
    }
    else {
        return { "cond": 1, "message": "Transaction authorized" };
    }
}
////#endregion - Transaction.


///#region - Loan's functions
function loanAutorization(srcBalance, dstBalance, amount) {
    if (amount > 0.6 * srcBalance) {
        return { "cond": 0, "message": "src account not have enough money for this loan amount" };
    }
    else if (amount > 0.5 * dstBalance) {
        return { "cond": 0, "message": "dst account not have enough money for this loan amount" };
    }
    else {
        return { "cond": 1, "message": "Loan autorized" };
    }
}

module.exports = {
    //getCurrentDateTime,
    //getCurrentDate,
    //getStringFromDate,
    //getDateTimeFromString,
    //getStringFromDateTime,
    //getDateFromString,
    isManager,
    findAccountDetails,
    updateAccountDetails,
    findUserDetails,
    checkBalance,
    getAllUserZero,
    loanAutorization,
    transactionAutorization,
    addMoneyToAccount,
    subMoneyfromAccount,
    updateUserRole
};