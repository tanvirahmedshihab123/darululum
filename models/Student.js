const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  roll: { type: String, required: true },
  name: { type: String, required: true },
  fatherName: String,
  motherName: String,
  mobile: { type: String, required: true },   // লগইনের জন্য
  guardianMobile: String,
  address: String,
  photo: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

studentSchema.index({ class: 1, roll: 1 }, { unique: true });
studentSchema.index({ mobile: 1 });

module.exports = mongoose.model('Student', studentSchema);