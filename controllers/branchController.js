const Branch = require('../models/Branch');

exports.create = async (req, res) => {
  try {
    const b = await Branch.create(req.body);
    res.status(201).json({ success: true, data: b });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

exports.list = async (req, res) => {
  const list = await Branch.find().sort('name');
  res.json({ success: true, data: list });
};

exports.update = async (req, res) => {
  const b = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!b) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: b });
};

exports.remove = async (req, res) => {
  await Branch.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};