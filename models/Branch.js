const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },  // যেমন: "মূল শাখা", "দ্বিতীয় শাখা"
  code: { type: String, required: true, unique: true, uppercase: true },
  address: String,
  phone: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);