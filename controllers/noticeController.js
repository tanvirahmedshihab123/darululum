const Notice = require('../models/Notice');

exports.create = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.admin._id };
    if (req.admin.role === 'branch') data.branch = req.admin.branch;
    const n = await Notice.create(data);
    res.status(201).json({ success: true, data: n });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

exports.list = async (req, res) => {
  const filter = {};
  if (req.admin.role === 'branch') filter.branch = req.admin.branch;
  else if (req.query.branch) filter.branch = req.query.branch;
  const list = await Notice.find(filter).populate('branch', 'name').sort('-createdAt');
  res.json({ success: true, data: list });
};

exports.update = async (req, res) => {
  const n = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!n) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: n });
};

exports.remove = async (req, res) => {
  await Notice.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};