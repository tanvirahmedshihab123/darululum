const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  // ─── Applicant Info ───
  name: { type: String, required: true, trim: true },
  nameBn: { type: String, trim: true },              // বাংলা নাম
  fatherName: { type: String, required: true, trim: true },
  motherName: { type: String, trim: true },
  mobile: { type: String, required: true, trim: true },        // applicant/guardian
  guardianMobile: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  religion: { type: String, default: 'ইসলাম' },
  nationality: { type: String, default: 'বাংলাদেশী' },
  bloodGroup: { type: String, trim: true },

  // ─── Address ───
  presentAddress: { type: String, trim: true },
  permanentAddress: { type: String, trim: true },

  // ─── Academic Info ───
  desiredBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  desiredClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  previousSchool: { type: String, trim: true },
  previousClass: { type: String, trim: true },
  previousResult: { type: String, trim: true },

  // ─── Guardian Info ───
  guardianOccupation: { type: String, trim: true },
  guardianRelation: { type: String, trim: true },    // father, mother, other

  // ─── Documents ───
  photo: { type: String },                            // applicant photo URL
  photoPublicId: { type: String },
  birthCertificate: { type: String },                 // PDF/image URL
  birthCertificatePublicId: { type: String },
  previousCertificate: { type: String },
  previousCertificatePublicId: { type: String },

  // ─── Application Status ───
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  applicationNo: { type: String, unique: true, sparse: true },  // ADM-2026-0001
  submittedAt: { type: Date, default: Date.now },

  // ─── Review ───
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  reviewedAt: { type: Date },
  remark: { type: String },

  // ─── On Approval ───
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  approvedRoll: { type: String },

  // ─── Tracking (no login, optional OTP later) ───
  trackingCode: { type: String, unique: true, sparse: true },   // 8-char code

}, { timestamps: true });

admissionSchema.index({ desiredBranch: 1, desiredClass: 1, status: 1 });
admissionSchema.index({ mobile: 1 });
admissionSchema.index({ applicationNo: 1 });

module.exports = mongoose.model('AdmissionApplication', admissionSchema);