const Result = require('../models/Result');

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'PDF required' });
    const { branch, class: classId, examName, year } = req.body;
    const result = await Result.create({
      branch, class: classId, examName, year,
      pdfUrl: `/uploads/results/${req.file.filename}`,
      uploadedBy: req.admin._id
    });
    res.status(201).json({ success: true, data: result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.list = async (req, res) => {
  const filter = {};
  if (req.query.branch) filter.branch = req.query.branch;
  if (req.query.class) filter.class = req.query.class;
  if (req.query.year) filter.year = req.query.year;
  if (req.admin.role === 'branch') filter.branch = req.admin.branch;

  const list = await Result.find(filter)
    .populate('class', 'name section')
    .populate('branch', 'name')
    .sort('-publishedAt');
  res.json({ success: true, data: list });
};

exports.togglePublish = async (req, res) => {
  const r = await Result.findById(req.params.id);
  if (!r) return res.status(404).json({ success: false, message: 'Not found' });
  r.isPublished = !r.isPublished;
  await r.save();
  res.json({ success: true, data: r });
};

exports.remove = async (req, res) => {
  await Result.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};