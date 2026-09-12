// const jwt = require('jsonwebtoken');
// const Admin = require('../models/Admin');
// const Student = require('../models/Student');

// const sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

// const adminAuth = async (req, res, next) => {
//   try {
//     const header = req.headers.authorization || '';
//     const token = header.startsWith('Bearer ') ? header.slice(7) : null;
//     if (!token) return res.status(401).json({ success: false, message: 'No token' });
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
//     const admin = await Admin.findById(decoded.id);
//     if (!admin || !admin.isActive) return res.status(401).json({ success: false, message: 'Invalid admin' });
//     req.admin = admin;
//     next();
//   } catch (e) {
//     res.status(401).json({ success: false, message: 'Invalid token' });
//   }
// };

// const superAdmin = (req, res, next) => {
//   if (req.admin.role !== 'super') return res.status(403).json({ success: false, message: 'Super admin only' });
//   next();
// };

// const studentAuth = async (req, res, next) => {
//   try {
//     const header = req.headers.authorization || '';
//     const token = header.startsWith('Bearer ') ? header.slice(7) : null;
//     if (!token) return res.status(401).json({ success: false, message: 'No token' });
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (decoded.role !== 'student') return res.status(403).json({ success: false, message: 'Student only' });
//     const student = await Student.findById(decoded.id).populate('branch class');
//     if (!student || !student.isActive) return res.status(401).json({ success: false, message: 'Invalid student' });
//     req.student = student;
//     next();
//   } catch (e) {
//     res.status(401).json({ success: false, message: 'Invalid token' });
//   }
// };

// module.exports = { sign, adminAuth, superAdmin, studentAuth };
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

const sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

const getToken = (req) => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
};

const adminAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) return res.status(401).json({ success: false, message: 'Invalid admin' });
    req.admin = admin;
    next();
  } catch (e) { res.status(401).json({ success: false, message: 'Invalid token' }); }
};

const superAdmin = (req, res, next) => {
  if (req.admin.role !== 'super')
    return res.status(403).json({ success: false, message: 'Super admin only' });
  next();
};

const studentAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'student') return res.status(403).json({ success: false, message: 'Student only' });
    const student = await Student.findById(decoded.id).populate('branch class');
    if (!student || !student.isActive) return res.status(401).json({ success: false, message: 'Invalid student' });
    req.student = student;
    next();
  } catch (e) { res.status(401).json({ success: false, message: 'Invalid token' }); }
};

module.exports = { sign, adminAuth, superAdmin, studentAuth };