const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: { type: String, required: true },
  section: { type: String, default: 'A' },
  monthlyFee: { type: Number, default: 0, min: 0 },   // 🆕 প্রতি মাসের ডিফল্ট বেতন
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

classSchema.index({ branch: 1, name: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);