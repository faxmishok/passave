const mongoose = require("mongoose");

const saveSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Save name is required!"],
  },
  email: {
    type: String,
    required: [true, "Email field is required!"],
  },
  password: {
    type: String,
    required: [true, "Password is required!"],
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Save", saveSchema);
