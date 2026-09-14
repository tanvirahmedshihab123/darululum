const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  examName: { type: String, required: true },
  year: { type: Number, required: true },
  pdfUrl: { type: String, required: true },                  // 👈 Cloudinary secure URL
  cloudinaryPublicId: { type: String },                      // 👈 delete করার জন্য
  publishedAt: { type: Date, default: Date.now },
  isPublished: { type: Boolean, default: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);