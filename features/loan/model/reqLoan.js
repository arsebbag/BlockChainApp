const { Schema, model } = require("mongoose");

const reqLoanSchema = new Schema({
    srcAccountId: String,//{type: Schema.Types.ObjectId, ref: 'Account'},
    destAccountId: String, //{type: Schema.Types.ObjectId, ref: 'Account'},
    amount: Number,
    dateOfLoan: { type: Date, default: Date.now },
    duration: Number, // in month
    approved: Number
}, { versionKey: false });

module.exports = model("requestedLoan", reqLoanSchema);