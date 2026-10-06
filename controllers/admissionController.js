const AdmissionApplication = require('../models/AdmissionApplication');
const Student = require('../models/Student');
const Branch = require('../models/Branch');
const Class = require('../models/Class');

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
const generateApplicationNo = async () => {
  const year = new Date().getFullYear();
  const prefix = `ADM-${year}-`;
  const count = await AdmissionApplication.countDocuments({
    applicationNo: new RegExp(`^${prefix}`)
  });
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
};

const generateTrackingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ═══════════════════════════════════════════════════════
// PUBLIC — Frontend থেকে apply
// ═══════════════════════════════════════════════════════

// POST /api/public/admission/apply
exports.apply = async (req, res) => {
  try {
    const {
      name, nameBn, fatherName, motherName,
      mobile, guardianMobile, email,
      dateOfBirth, gender, bloodGroup,
      presentAddress, permanentAddress,
      desiredBranch, desiredClass,
      previousSchool, previousClass, previousResult,
      guardianOccupation, guardianRelation,
    } = req.body;

    // ─── Validation ───
    if (!name || !fatherName || !mobile || !desiredBranch || !desiredClass) {
      return res.status(400).json({
        success: false,
        message: 'নাম, পিতার নাম, মোবাইল, শাখা ও শ্রেণী আবশ্যক',
      });
    }

    // ─── Check branch/class exist ───
    const branch = await Branch.findById(desiredBranch);
    if (!branch) return res.status(400).json({ success: false, message: 'শাখা পাওয়া যায়নি' });

    const cls = await Class.findById(desiredClass);
    if (!cls) return res.status(400).json({ success: false, message: 'শ্রেণী পাওয়া যায়নি' });

    // ─── Check duplicate active application ───
    const existing = await AdmissionApplication.findOne({
      mobile,
      desiredClass,
      status: { $in: ['pending', 'reviewing'] },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'এই মোবাইল ও শ্রেণীতে একটি আবেদন ইতিমধ্যে জমা আছে',
        applicationNo: existing.applicationNo,
        trackingCode: existing.trackingCode,
      });
    }

    // ─── Photo ───
    let photoUrl, photoPublicId;
    if (req.files?.photo?.[0]) {
      photoUrl = req.files.photo[0].path;
      photoPublicId = req.files.photo[0].filename;
    }

    let birthCertUrl, birthCertPublicId;
    if (req.files?.birthCertificate?.[0]) {
      birthCertUrl = req.files.birthCertificate[0].path;
      birthCertPublicId = req.files.birthCertificate[0].filename;
    }

    let prevCertUrl, prevCertPublicId;
    if (req.files?.previousCertificate?.[0]) {
      prevCertUrl = req.files.previousCertificate[0].path;
      prevCertPublicId = req.files.previousCertificate[0].filename;
    }

    // ─── Generate IDs ───
    const applicationNo = await generateApplicationNo();
    let trackingCode = generateTrackingCode();

    // Ensure unique tracking code
    let attempts = 0;
    while (await AdmissionApplication.findOne({ trackingCode }) && attempts < 5) {
      trackingCode = generateTrackingCode();
      attempts++;
    }

    // ─── Create ───
    const application = await AdmissionApplication.create({
      name: String(name).trim(),
      nameBn: nameBn ? String(nameBn).trim() : undefined,
      fatherName: String(fatherName).trim(),
      motherName: motherName ? String(motherName).trim() : undefined,
      mobile: String(mobile).trim(),
      guardianMobile: guardianMobile ? String(guardianMobile).trim() : undefined,
      email: email ? String(email).trim() : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      bloodGroup,
      presentAddress,
      permanentAddress,
      desiredBranch,
      desiredClass,
      previousSchool,
      previousClass,
      previousResult,
      guardianOccupation,
      guardianRelation,
      photo: photoUrl,
      photoPublicId,
      birthCertificate: birthCertUrl,
      birthCertificatePublicId: birthCertPublicId,
      previousCertificate: prevCertUrl,
      previousCertificatePublicId: prevCertPublicId,
      applicationNo,
      trackingCode,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: '✅ আবেদন সফলভাবে জমা হয়েছে',
      data: {
        id: application._id,
        applicationNo: application.applicationNo,
        trackingCode: application.trackingCode,
        name: application.name,
        status: application.status,
        submittedAt: application.submittedAt,
      },
    });
  } catch (e) {
    console.error('Admission apply error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/public/admission/track/:trackingCode
// GET /api/public/admission/track?mobile=&applicationNo=
exports.track = async (req, res) => {
  try {
    const { trackingCode } = req.params;
    const { mobile, applicationNo } = req.query;

    let filter = {};
    if (trackingCode) filter.trackingCode = trackingCode.toUpperCase();
    else if (mobile && applicationNo) {
      filter.mobile = mobile;
      filter.applicationNo = applicationNo.toUpperCase();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Tracking code অথবা মোবাইল + Application No দিন',
      });
    }

    const app = await AdmissionApplication.findOne(filter)
      .populate('desiredBranch', 'name code')
      .populate('desiredClass', 'name section')
      .select('-reviewedBy -__v');

    if (!app) {
      return res.status(404).json({ success: false, message: 'আবেদন পাওয়া যায়নি' });
    }

    res.json({
      success: true,
      data: {
        applicationNo: app.applicationNo,
        trackingCode: app.trackingCode,
        name: app.name,
        nameBn: app.nameBn,
        fatherName: app.fatherName,
        mobile: app.mobile,
        photo: app.photo,
        desiredBranch: app.desiredBranch,
        desiredClass: app.desiredClass,
        status: app.status,
        remark: app.remark,
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt,
        approvedRoll: app.approvedRoll,
        studentId: app.studentId,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/public/admission/branches-classes
// For application form dropdowns
exports.publicBranchesClasses = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).select('name code');
    const classes = await Class.find({ isActive: true }).select('name section branch');
    res.json({ success: true, data: { branches, classes } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ═══════════════════════════════════════════════════════
// ADMIN — Review & Approve
// ═══════════════════════════════════════════════════════

// GET /api/admin/admissions
exports.listApplications = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.branch) filter.desiredBranch = req.query.branch;
    if (req.query.class) filter.desiredClass = req.query.class;
    if (req.query.search) {
      const q = req.query.search;
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { nameBn: new RegExp(q, 'i') },
        { mobile: new RegExp(q, 'i') },
        { applicationNo: new RegExp(q, 'i') },
        { fatherName: new RegExp(q, 'i') },
      ];
    }
    if (req.admin.role === 'branch') filter.desiredBranch = req.admin.branch;

    const list = await AdmissionApplication.find(filter)
      .populate('desiredBranch', 'name code')
      .populate('desiredClass', 'name section')
      .populate('studentId', 'name roll')
      .sort('-submittedAt');

    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/admin/admissions/:id
exports.getApplication = async (req, res) => {
  try {
    const app = await AdmissionApplication.findById(req.params.id)
      .populate('desiredBranch', 'name code address phone')
      .populate('desiredClass', 'name section monthlyFee')
      .populate('studentId', 'name roll mobile');

    if (!app) return res.status(404).json({ success: false, message: 'Not found' });

    // Branch admin — own branch only
    if (req.admin.role === 'branch' &&
        String(app.desiredBranch?._id) !== String(req.admin.branch)) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    res.json({ success: true, data: app });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// PATCH /api/admin/admissions/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status, remark } = req.body;

    if (!['pending', 'reviewing', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Approve করার জন্য /approve endpoint ব্যবহার করুন',
      });
    }

    const app = await AdmissionApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Not found' });

    if (req.admin.role === 'branch' &&
        String(app.desiredBranch) !== String(req.admin.branch)) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    app.status = status;
    app.remark = remark;
    app.reviewedBy = req.admin._id;
    app.reviewedAt = new Date();
    await app.save();

    res.json({ success: true, data: app });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/admin/admissions/:id/approve
exports.approve = async (req, res) => {
  try {
    const { roll, className, section, monthlyFee } = req.body;

    const app = await AdmissionApplication.findById(req.params.id)
      .populate('desiredBranch')
      .populate('desiredClass');

    if (!app) return res.status(404).json({ success: false, message: 'Not found' });
    if (app.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'এই আবেদন ইতিমধ্যে অনুমোদিত',
        studentId: app.studentId,
      });
    }
    if (app.status === 'rejected' || app.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'বাতিল আবেদন অনুমোদন করা যায় না' });
    }

    // Branch admin — own branch only
    if (req.admin.role === 'branch' &&
        String(app.desiredBranch?._id) !== String(req.admin.branch)) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    // ─── Auto-generate roll if not provided ───
    let finalRoll = roll;
    if (!finalRoll) {
      const lastStudent = await Student.findOne({ class: app.desiredClass._id })
        .sort('-roll')
        .select('roll');
      const lastNum = lastStudent ? parseInt(lastStudent.roll, 10) || 0 : 0;
      finalRoll = String(lastNum + 1).padStart(2, '0');
    }

    // ─── Check roll uniqueness ───
    const existing = await Student.findOne({
      class: app.desiredClass._id,
      roll: finalRoll,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Roll ${finalRoll} এই শ্রেণীতে already আছে। ভিন্ন roll দিন।`,
      });
    }

    // ─── Create Student ───
    const student = await Student.create({
      branch: app.desiredBranch._id,
      class: app.desiredClass._id,
      roll: finalRoll,
      name: app.name,
      fatherName: app.fatherName,
      motherName: app.motherName,
      mobile: app.mobile,
      guardianMobile: app.guardianMobile || app.mobile,
      address: app.presentAddress || app.permanentAddress,
      photo: app.photo,
      cloudinaryPublicId: app.photoPublicId,
      isActive: true,
    });

    // ─── Update application ───
    app.status = 'approved';
    app.studentId = student._id;
    app.approvedRoll = finalRoll;
    app.reviewedBy = req.admin._id;
    app.reviewedAt = new Date();
    if (req.body.remark) app.remark = req.body.remark;
    await app.save();

    res.json({
      success: true,
      message: '✅ আবেদন অনুমোদিত এবং ছাত্র তৈরি হয়েছে',
      data: {
        application: app,
        student: {
          _id: student._id,
          name: student.name,
          roll: student.roll,
          class: app.desiredClass.name,
          section: app.desiredClass.section,
        },
      },
    });
  } catch (e) {
    console.error('Approve error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// DELETE /api/admin/admissions/:id
exports.removeApplication = async (req, res) => {
  try {
    const app = await AdmissionApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Not found' });

    if (req.admin.role === 'branch' &&
        String(app.desiredBranch) !== String(req.admin.branch)) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    // Cleanup Cloudinary files (optional)
    try {
      const cloudinary = require('../config/cloudinary');
      if (app.photoPublicId) await cloudinary.uploader.destroy(app.photoPublicId);
      if (app.birthCertificatePublicId) await cloudinary.uploader.destroy(app.birthCertificatePublicId, { resource_type: 'raw' });
      if (app.previousCertificatePublicId) await cloudinary.uploader.destroy(app.previousCertificatePublicId, { resource_type: 'raw' });
    } catch (err) {
      console.warn('Cloudinary cleanup failed:', err.message);
    }

    await app.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/admin/admissions/stats
exports.stats = async (req, res) => {
  try {
    const filter = {};
    if (req.admin.role === 'branch') filter.desiredBranch = req.admin.branch;

    const [pending, reviewing, approved, rejected] = await Promise.all([
      AdmissionApplication.countDocuments({ ...filter, status: 'pending' }),
      AdmissionApplication.countDocuments({ ...filter, status: 'reviewing' }),
      AdmissionApplication.countDocuments({ ...filter, status: 'approved' }),
      AdmissionApplication.countDocuments({ ...filter, status: 'rejected' }),
    ]);

    res.json({
      success: true,
      data: { pending, reviewing, approved, rejected, total: pending + reviewing + approved + rejected },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};