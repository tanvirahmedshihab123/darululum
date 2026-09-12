const Setting = require('../models/Setting');
const { uploadScreenshot } = require('../middleware/upload');

exports.get = async (req, res) => {
  let s = await Setting.findOne({ key: 'payment' });
  if (!s) s = await Setting.create({ key: 'payment' });
  res.json({ success: true, data: s });
};

// public — student portal ব্যবহার করবে
exports.getPublic = async (req, res) => {
  let s = await Setting.findOne({ key: 'payment' });
  if (!s) s = await Setting.create({ key: 'payment' });
  res.json({
    success: true,
    data: {
      bkash: s.bkash, nagad: s.nagad, rocket: s.rocket,
      qrImageUrl: s.qrImageUrl, instructions: s.instructions
    }
  });
};

exports.update = async (req, res) => {
  const update = { ...req.body, updatedBy: req.admin._id };
  const s = await Setting.findOneAndUpdate(
    { key: 'payment' },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, data: s });
};

exports.uploadQr = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'QR image required' });
  const url = `/uploads/fees/${req.file.filename}`;
  const s = await Setting.findOneAndUpdate(
    { key: 'payment' },
    { qrImageUrl: url, updatedBy: req.admin._id },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, data: s });
};