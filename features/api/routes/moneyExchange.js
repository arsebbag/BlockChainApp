// js file to change money(USD, ILS, LevCoin) via api of money exchange
const axios = require("axios")
const Account = require("../../account/models/account")

const strUSDtoILS = "&base=USD&target=ILS"
const strILStoUSD = "&base=ILS&target=USD"
const connectionString = "https://exchange-rates.abstractapi.com/v1/live/?api_key=2eea42202dab4b7581562c41e0430d92"

async function changeUSDtoILS(amount) {
    return axios.get(connectionString + strUSDtoILS)
        .then(response => {
            //console.log(response.data.exchange_rates.ILS * amount)
            return response.data.exchange_rates.ILS * amount
        })
        .catch(error => {
            return error
        });
}

async function changeILStoUSD(amount) {
    return axios.get(connectionString + strILStoUSD)
        .then(response => {
            return response.data.exchange_rates.USD * amount
        })
        .catch(error => {
            return error
        });
}


// LEVCOIN settings and values
var LEVCOIN = 1; // 1 LevCoin is equals to 1 dollars
var countLevCoin = 0;
var countUsers = 0;

async function countAccounts() {
    return Account.countDocuments({}).then(res => {
        return res;
    });
}
async function changeToILS() {
    let rate = await changeUSDtoILS(1);
    console.log(rate)
    return LEVCOIN * rate
}
//change LEVCOIN value
function updateLevCoinValue(num) {
    countUsers += 1;
    countLevCoin += num;
    console.log(countLevCoin)
    console.log(countUsers)
    LEVCOIN = (LEVCOIN - (LEVCOIN / (100 + countLevCoin - countUsers)))//formula for the regression of the LEVCOIN
    console.log("LEVCOIN", LEVCOIN)
}

async function getAllBalanceCurrencies(amount) {
    return {
        "LEVCOIN": amount,
        "ILS": await changeToILS() * amount,
        "USD": LEVCOIN * amount
    }
}

module.exports = {
    changeILStoUSD,
    changeUSDtoILS,
    updateLevCoinValue,
    LEVCOIN,
    //LEVCOINILS,
    getAllBalanceCurrencies
}