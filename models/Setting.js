const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'payment' },
  bkash: { type: String, default: '' },
  nagad: { type: String, default: '' },
  rocket: { type: String, default: '' },
  qrImageUrl: { type: String, default: '' },       // স্ক্রিনশট QR
  instructions: { type: String, default: '' },     // যেমন "Send Money করে ট্রানজেকশন আইডি সাবমিট করুন"
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);