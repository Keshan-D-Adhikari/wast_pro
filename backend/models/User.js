const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,

  /* NEW FIELDS */
  profileImage: String,
  orders: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  rewards: { type: Number, default: 0 },
});

module.exports = mongoose.model('User', UserSchema);
