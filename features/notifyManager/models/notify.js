const { Schema, model } = require("mongoose");
const Person = require("../../authentication/models/Person");
const Credentials = require("../../authentication/models/Credentials");

const notifySchema = new Schema({
  ...Person,
  ...Credentials,
  message: { type: String },
});

module.exports = model("Notify_manager", notifySchema);
