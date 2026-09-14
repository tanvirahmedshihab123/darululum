const Student = require('../models/Student');

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.photo = req.file.path;                   // 👈 Cloudinary URL
      data.cloudinaryPublicId = req.file.filename;
    }
    if (req.admin.role === 'branch') data.branch = req.admin.branch;
    const s = await Student.create(data);
    res.status(201).json({ success: true, data: s });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.list = async (req, res) => {
  const filter = {};
  if (req.query.class) filter.class = req.query.class;
  if (req.query.branch) filter.branch = req.query.branch;
  if (req.admin.role === 'branch') filter.branch = req.admin.branch;
  const list = await Student.find(filter)
    .populate('class', 'name section')
    .populate('branch', 'name code')
    .sort('roll');
  res.json({ success: true, data: list });
};

exports.get = async (req, res) => {
  const s = await Student.findById(req.params.id).populate('class branch');
  if (!s) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: s });
};

exports.update = async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.photo = `/uploads/students/${req.file.filename}`;
  const s = await Student.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!s) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: s });
};

exports.remove = async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

