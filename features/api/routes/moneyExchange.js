// js file to change money(USD, ILS, LevCoin) via api of money exchange
const axios = require("axios")


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

//dbg
// changeUSDtoILS(0.5).then((result) => {
//     console.log(result)
// })
//changeILStoUSD()
/////////////////////////

// LEVCOIN settings and values
var LEVCOIN = 1; // 1 LevCoin is equals to 1 dollars
//var LEVCOINILS = LEVCOIN * changeUSDtoILS(1);
var countLevCoin = 0;

async function changeToILS() {
    let rate = await changeUSDtoILS(1);
    console.log(rate)
    return LEVCOIN * rate
}
//change LEVCOIN value
function buyLevCoin(num) {
    countLevCoin += num;
    LEVCOIN = Math.ceil(LEVCOIN - (LEVCOIN / 10000 + countLevCoin))
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
    buyLevCoin,
    LEVCOIN,
    //LEVCOINILS,
    getAllBalanceCurrencies
}