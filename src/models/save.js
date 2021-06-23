const mongoose = require('mongoose');

const saveSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Save name is required!'],
  },
  username: {
    type: String,
  },
  email: {
    type: String,
    required: [true, 'Email field is required!'],
  },
  password: {
    type: String,
    required: [true, 'Password is required!'],
  },
  registered_number: {
    type: String,
  },
  loginURL: {
    type: String,
    unique: true,
  },
  additional: {
    type: String,
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
});

// check for URL
saveSchema.path('loginURL').validate((val) => {
  urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
  return urlRegex.test(val);
}, 'Invalid URL.');

module.exports = mongoose.model('Save', saveSchema);
