const mongoose = require('mongoose');

// days[i] = i+1 তারিখের অবস্থা; 'P'=Present, 'A'=Absent, 'L'=Leave, null=Not marked
const attendanceSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  days: [{ type: String, enum: ['P', 'A', 'L', null], default: null }],
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

attendanceSchema.index({ student: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);