const Student = require('../models/Student');
const Class = require('../models/Class');
const Branch = require('../models/Branch');
const Result = require('../models/Result');
const Fee = require('../models/Fee');
const Notice = require('../models/Notice');
const { sign } = require('../middleware/auth');

// লগইন: mobile + classId + roll
exports.login = async (req, res) => {
  try {
    const { mobile, classId, roll } = req.body;
    if (!mobile || !classId || !roll)
      return res.status(400).json({ success: false, message: 'mobile, classId, roll required' });

    const student = await Student.findOne({ mobile, class: classId, roll })
      .populate('class branch');
    if (!student) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!student.isActive) return res.status(403).json({ success: false, message: 'Inactive student' });

    const token = sign({ id: student._id, role: 'student' });
    res.json({
      success: true, token,
      student: {
        id: student._id, name: student.name, roll: student.roll,
        class: { id: student.class._id, name: student.class.name, section: student.class.section },
        branch: { id: student.branch._id, name: student.branch.name }
      }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.profile = (req, res) => res.json({ success: true, data: req.student });

// লগইন পেজে branch+class dropdown এর জন্য (public)
exports.publicBranches = async (req, res) => {
  const branches = await Branch.find({ isActive: true }).select('name code');
  const classes = await Class.find({ isActive: true }).select('name section branch');
  res.json({ success: true, data: { branches, classes } });
};

// Student: নিজের ক্লাসের result list
exports.results = async (req, res) => {
  const list = await Result.find({
    class: req.student.class._id,
    isPublished: true
  }).sort('-publishedAt');
  res.json({ success: true, data: list });
};

// Student: নিজের fee list
exports.fees = async (req, res) => {
  const list = await Fee.find({ student: req.student._id }).sort('-year -month');
  res.json({ success: true, data: list });
};

// Student: fee submit — transactionId + screenshot
exports.submitFee = async (req, res) => {
  try {
    const { feeId, transactionId } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'Screenshot required' });
    if (!transactionId) return res.status(400).json({ success: false, message: 'transactionId required' });

    const fee = await Fee.findById(feeId);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee not found' });
    if (String(fee.student) !== String(req.student._id))
      return res.status(403).json({ success: false, message: 'Not your fee' });
    if (fee.status === 'verified')
      return res.status(400).json({ success: false, message: 'Already verified' });

    fee.transactionId = transactionId;
    fee.screenshotUrl = `/uploads/fees/${req.file.filename}`;
    fee.status = 'submitted';
    fee.submittedAt = new Date();
    await fee.save();
    res.json({ success: true, data: fee });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Student: notice board
exports.notices = async (req, res) => {
  const now = new Date();
  const list = await Notice.find({
    isActive: true,
    $and: [
      { $or: [{ branch: req.student.branch._id }, { branch: null }, { branch: { $exists: false } }] },
      { $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }, { expiresAt: { $exists: false } }] }
    ]
  }).sort('-createdAt');
  res.json({ success: true, data: list });
};
// Student নিজে advance fee request করতে পারবে
exports.requestAdvance = async (req, res) => {
  try {
    const Fee = require('../models/Fee');
    const Class = require('../models/Class');
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'month and year required' });
    }

    const exists = await Fee.findOne({ student: req.student._id, month, year });
    if (exists) {
      return res.status(400).json({ success: false, message: 'এই মাসের fee already আছে' });
    }

    const cls = await Class.findById(req.student.class);
    const fee = await Fee.create({
      branch: req.student.branch,
      class: req.student.class,
      student: req.student._id,
      month,
      year,
      amount: cls?.monthlyFee || 0,
      isAdvance: true,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: fee });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};