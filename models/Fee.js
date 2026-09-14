const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  amount: { type: Number, required: true },

  // 🆕 advance বা regular
  isAdvance: { type: Boolean, default: false },

  status: { type: String, enum: ['pending', 'submitted', 'verified', 'rejected'], default: 'pending' },

  // 🆕 পেমেন্ট পদ্ধতি
  method: { type: String, enum: ['bkash', 'nagad', 'rocket', 'cash', null], default: null },
  transactionId: String,
  screenshotUrl: String,
  senderNumber: String,
  cloudinaryPublicId: String,
  submittedAt: Date,
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

  // 🆕 রসিদের জন্য unique number
  receiptNo: { type: String, unique: true, sparse: true },
  remark: String
}, { timestamps: true });

feeSchema.index({ student: 1, month: 1, year: 1 }, { unique: true });

// রসিদ নাম্বার জেনারেট
feeSchema.pre('save', async function (next) {
  if (this.status === 'verified' && !this.receiptNo) {
    const count = await this.constructor.countDocuments({ status: 'verified' });
    const yy = String(this.year).slice(-2);
    const mm = String(this.month).padStart(2, '0');
    this.receiptNo = `RCP-${yy}${mm}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Fee', feeSchema);