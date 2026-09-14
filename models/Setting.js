// models/Setting.js
const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true, default: 'payment' },
  data: {
    bkash: { type: String, default: '' },
    nagad: { type: String, default: '' },
    rocket: { type: String, default: '' },
    qrImageUrl: { type: String, default: '' },
    qrPublicId: { type: String, default: '' },
    instructions: { type: String, default: '' }
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);