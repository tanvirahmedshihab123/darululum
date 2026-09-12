const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, // null = সব শাখায় যাবে
  title: { type: String, required: true },
  body: { type: String, required: true },
  priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
  isActive: { type: Boolean, default: true },
  expiresAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);