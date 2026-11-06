

const Announcement = require('../models/Announcement');
const cloudinary = require('../config/cloudinary');

// Ensure models registered for populate
require('../models/Branch');

// ═══════════════════════════════════════════════════════
// PUBLIC — Frontend popup
// ═══════════════════════════════════════════════════════

// GET /api/public/announcements?branch=<id>
exports.publicList = async (req, res) => {
  try {
    const now = new Date();
    const filter = {
      isActive: true,
      startsAt: { $lte: now },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ],
    };

    if (req.query.branch) {
      filter.$and = [
        {
          $or: [
            { targetBranch: req.query.branch },
            { targetBranch: null },
          ],
        },
      ];
    }

    const list = await Announcement.find(filter)
      .populate('targetBranch', 'name')
      .select('-pdfPublicId -imagePublicId -createdBy -views -dismissals')
      .sort({ priority: -1, startsAt: -1 })
      .limit(20);

    res.json({ success: true, data: list });
  } catch (e) {
    console.error('Public announcements error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/public/announcements/:id/view
exports.trackView = async (req, res) => {
  try {
    await Announcement.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/public/announcements/:id/dismiss
exports.trackDismiss = async (req, res) => {
  try {
    await Announcement.updateOne({ _id: req.params.id }, { $inc: { dismissals: 1 } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ═══════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════

// POST /api/admin/announcements
exports.create = async (req, res) => {
  try {
    const {
      type, title, titleBn, body,
      priority, targetBranch,
      startsAt, expiresAt,
      showAsPopup, allowDismiss,
      ctaText, ctaLink,
    } = req.body;

    if (!type || !title) {
      return res.status(400).json({ success: false, message: 'type এবং title আবশ্যক' });
    }

    const data = {
      type,
      title: String(title).trim(),
      titleBn: titleBn ? String(titleBn).trim() : undefined,
      body: body ? String(body).trim() : undefined,
      priority: priority || 'normal',
      targetBranch: targetBranch && targetBranch !== 'all' ? targetBranch : null,
      startsAt: startsAt ? new Date(startsAt) : new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      showAsPopup: showAsPopup === 'true' || showAsPopup === true,
      allowDismiss: allowDismiss !== 'false' && allowDismiss !== false,
      ctaText: ctaText || undefined,
      ctaLink: ctaLink || undefined,
      createdBy: req.admin._id,
    };

    if (req.files?.pdf?.[0]) {
      data.pdfUrl = req.files.pdf[0].path;
      data.pdfPublicId = req.files.pdf[0].filename;
    }

    if (req.files?.image?.[0]) {
      data.imageUrl = req.files.image[0].path;
      data.imagePublicId = req.files.image[0].filename;
    }

    if (type === 'pdf' && !data.pdfUrl) {
      return res.status(400).json({ success: false, message: 'PDF file required' });
    }
    if (type === 'image' && !data.imageUrl) {
      return res.status(400).json({ success: false, message: 'Image file required' });
    }
    if (type === 'notice' && !data.body) {
      return res.status(400).json({ success: false, message: 'Notice body required' });
    }

    const ann = await Announcement.create(data);
    res.status(201).json({ success: true, data: ann });
  } catch (e) {
    console.error('Create announcement error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/admin/announcements
exports.list = async (req, res) => {
  try {
    console.log('━━━ Admin announcements list ━━━');
    console.log('Query:', req.query);
    console.log('Admin:', req.admin?._id, req.admin?.role);

    const filter = {};

    if (req.query.type) filter.type = req.query.type;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.branch) filter.targetBranch = req.query.branch;

    if (req.query.search) {
      filter.$or = [
        { title: new RegExp(req.query.search, 'i') },
        { titleBn: new RegExp(req.query.search, 'i') },
      ];
    }

    // Branch admin — own branch only
    if (req.admin?.role === 'branch') {
      filter.$or = [
        { targetBranch: req.admin.branch },
        { targetBranch: null },
      ];
    }

    const list = await Announcement.find(filter)
      .populate('targetBranch', 'name')       // ✅ removed .populate('branch')
      .sort('-createdAt');

    console.log('✅ Found:', list.length, 'announcements');
    res.json({ success: true, data: list });
  } catch (e) {
    console.error('❌ Admin list error:', e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// GET /api/admin/announcements/:id
exports.get = async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id)
      .populate('targetBranch', 'name');
    if (!ann) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: ann });
  } catch (e) {
    console.error('Get announcement error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/admin/announcements/:id
exports.update = async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ success: false, message: 'Not found' });

    const editable = [
      'title', 'titleBn', 'body', 'priority',
      'startsAt', 'expiresAt',
      'showAsPopup', 'allowDismiss', 'ctaText', 'ctaLink', 'isActive',
    ];

    editable.forEach((k) => {
      if (req.body[k] !== undefined) {
        if (k === 'startsAt' || k === 'expiresAt') {
          ann[k] = req.body[k] ? new Date(req.body[k]) : undefined;
        } else if (k === 'showAsPopup' || k === 'allowDismiss' || k === 'isActive') {
          ann[k] = req.body[k] === 'true' || req.body[k] === true;
        } else {
          ann[k] = req.body[k];
        }
      }
    });

    if (req.body.targetBranch !== undefined) {
      ann.targetBranch = req.body.targetBranch && req.body.targetBranch !== 'all'
        ? req.body.targetBranch
        : null;
    }

    if (req.files?.pdf?.[0]) {
      if (ann.pdfPublicId) {
        try { await cloudinary.uploader.destroy(ann.pdfPublicId, { resource_type: 'raw' }); } catch {}
      }
      ann.pdfUrl = req.files.pdf[0].path;
      ann.pdfPublicId = req.files.pdf[0].filename;
    }
    if (req.files?.image?.[0]) {
      if (ann.imagePublicId) {
        try { await cloudinary.uploader.destroy(ann.imagePublicId, { resource_type: 'image' }); } catch {}
      }
      ann.imageUrl = req.files.image[0].path;
      ann.imagePublicId = req.files.image[0].filename;
    }

    await ann.save();
    res.json({ success: true, data: ann });
  } catch (e) {
    console.error('Update announcement error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// PATCH /api/admin/announcements/:id/toggle
exports.toggleActive = async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ success: false, message: 'Not found' });
    ann.isActive = !ann.isActive;
    await ann.save();
    res.json({ success: true, data: ann });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// DELETE /api/admin/announcements/:id
exports.remove = async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ success: false, message: 'Not found' });

    if (ann.pdfPublicId) {
      try { await cloudinary.uploader.destroy(ann.pdfPublicId, { resource_type: 'raw' }); } catch {}
    }
    if (ann.imagePublicId) {
      try { await cloudinary.uploader.destroy(ann.imagePublicId, { resource_type: 'image' }); } catch {}
    }

    await ann.deleteOne();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};