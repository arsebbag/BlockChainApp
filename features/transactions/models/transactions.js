const { Schema, model } = require("mongoose");
//need to link with the blockChain
const transactionSchema = new Schema({
    //maybe need an id but not sure!!
    thisHash: String,
    prevHash: String,
    data: {
        srcAccountId: String,
        destAccountId: String,
        amount: Number
    },
    dateOfTrans: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = model("Transaction", transactionSchema);