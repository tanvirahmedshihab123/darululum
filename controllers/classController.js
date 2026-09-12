const Class = require('../models/Class');

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.admin.role === 'branch') data.branch = req.admin.branch;
    const c = await Class.create(data);
    res.status(201).json({ success: true, data: c });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

exports.list = async (req, res) => {
  const filter = {};
  if (req.query.branch) filter.branch = req.query.branch;
  if (req.admin.role === 'branch') filter.branch = req.admin.branch;
  const list = await Class.find(filter).populate('branch', 'name code').sort('name');
  res.json({ success: true, data: list });
};

exports.update = async (req, res) => {
  const c = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!c) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: c });
};

exports.remove = async (req, res) => {
  await Class.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};