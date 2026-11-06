const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  // ─── Content ───
  type: {
    type: String,
    enum: ['pdf', 'image', 'notice'],
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true },
  titleBn: { type: String, trim: true },
  body: { type: String, trim: true },           // for notice type

  // ─── Attachments ───
  pdfUrl: { type: String },
  pdfPublicId: { type: String },
  imageUrl: { type: String },
  imagePublicId: { type: String },

  // ─── Meta ───
  priority: {
    type: String,
    enum: ['normal', 'important', 'urgent'],
    default: 'normal',
    index: true,
  },
  targetBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,           // null = all branches
  },

  // ─── Schedule ───
  isActive: { type: Boolean, default: true, index: true },
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: true },

  // ─── Display ───
  showAsPopup: { type: Boolean, default: true },       // popup or just list
  allowDismiss: { type: Boolean, default: true },      // user "don't show again"
  ctaText: { type: String, trim: true },               // e.g. "Download PDF"
  ctaLink: { type: String, trim: true },

  // ─── Tracking ───
  views: { type: Number, default: 0 },
  dismissals: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

announcementSchema.index({ isActive: 1, startsAt: -1 });
announcementSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);