

const Result = require('../models/Result');
const cloudinary = require('../config/cloudinary');

// ── Helper: signed URL generate ──
const getSignedUrl = (publicId, resourceType = 'raw', format = 'pdf') => {
  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    expires_at: Math.floor(Date.now() / 1000) + 3600  // 1 hour valid
  });
};

// ── PDF Upload ──
exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'PDF required' });

    const { branch, class: classId, examName, year } = req.body;

    // Cloudinary থেকে আসা data
    const result = await Result.create({
      branch,
      class: classId,
      examName,
      year: Number(year),
      pdfUrl: req.file.path,                      // base URL
      cloudinaryPublicId: req.file.filename,      // delete করার জন্য
      uploadedBy: req.admin._id
    });

    res.status(201).json({ success: true, data: result });
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── List — প্রতিটি result এ signed URL সহ ──
exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.class) filter.class = req.query.class;
    if (req.query.year) filter.year = req.query.year;
    if (req.admin.role === 'branch') filter.branch = req.admin.branch;

    const list = await Result.find(filter)
      .populate('class', 'name section')
      .populate('branch', 'name')
      .sort('-publishedAt');

    // ✅ প্রতিটি result এ signed URL যোগ করুন
    const dataWithSignedUrl = list.map((r) => {
      const obj = r.toObject();
      if (r.cloudinaryPublicId) {
        try {
          obj.signedUrl = getSignedUrl(r.cloudinaryPublicId, 'raw', 'pdf');
        } catch (err) {
          console.warn('Signed URL failed:', err.message);
          obj.signedUrl = r.pdfUrl;   // fallback
        }
      }
      return obj;
    });

    res.json({ success: true, data: dataWithSignedUrl });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.togglePublish = async (req, res) => {
  try {
    const r = await Result.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });
    r.isPublished = !r.isPublished;
    await r.save();
    res.json({ success: true, data: r });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const r = await Result.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });

    if (r.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(r.cloudinaryPublicId, { resource_type: 'raw' });
      } catch (err) {
        console.warn('Cloudinary delete failed:', err.message);
      }
    }

    await r.deleteOne();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};