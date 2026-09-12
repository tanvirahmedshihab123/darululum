const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { sign } = require('../middleware/auth');

// প্রথম অ্যাডমিন free register করতে পারবে, তারপর শুধু super admin
exports.register = async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) {
      const h = req.headers.authorization || '';
      const token = h.startsWith('Bearer ') ? h.slice(7) : null;
      if (!token) return res.status(403).json({ success: false, message: 'Only super admin can register' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const requester = await Admin.findById(decoded.id);
      if (!requester || requester.role !== 'super')
        return res.status(403).json({ success: false, message: 'Only super admin can register' });
    }
    const { name, email, password, role, branch } = req.body;
    if (await Admin.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already exists' });
    const admin = await Admin.create({
      name, email, password,
      role: count === 0 ? 'super' : (role || 'branch'),
      branch
    });
    res.status(201).json({ success: true, data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).populate('branch');
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!admin.isActive) return res.status(403).json({ success: false, message: 'Account disabled' });
    const token = sign({ id: admin._id, role: 'admin', adminRole: admin.role });
    res.json({
      success: true, token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, branch: admin.branch }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.me = (req, res) => res.json({ success: true, admin: req.admin });