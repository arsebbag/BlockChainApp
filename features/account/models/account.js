//crud operations
const { Schema, model } = require('mongoose')
const User = require('../../authentication/models/user')
// Account have a id(- Account no.), all user attributes, balance on the account.
const accountSchema = new Schema({
    ownerId: {
        type: String,
        //type: Schema.Types.ObjectId, ref: 'User', 
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    managerId: {
        type: String,
        //type: Schema.Types.ObjectId, ref: 'User', 
        required: true
    }
}, { versionKey: false });

module.exports = model("Account", accountSchema);