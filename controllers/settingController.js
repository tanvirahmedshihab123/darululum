// // // const Setting = require('../models/Setting');
// // // const { uploadScreenshot } = require('../middleware/upload');

// // // exports.get = async (req, res) => {
// // //   let s = await Setting.findOne({ key: 'payment' });
// // //   if (!s) s = await Setting.create({ key: 'payment' });
// // //   res.json({ success: true, data: s });
// // // };

// // // // public — student portal ব্যবহার করবে
// // // exports.getPublic = async (req, res) => {
// // //   let s = await Setting.findOne({ key: 'payment' });
// // //   if (!s) s = await Setting.create({ key: 'payment' });
// // //   res.json({
// // //     success: true,
// // //     data: {
// // //       bkash: s.bkash, nagad: s.nagad, rocket: s.rocket,
// // //       qrImageUrl: s.qrImageUrl, instructions: s.instructions
// // //     }
// // //   });
// // // };

// // // exports.update = async (req, res) => {
// // //   const update = { ...req.body, updatedBy: req.admin._id };
// // //   const s = await Setting.findOneAndUpdate(
// // //     { key: 'payment' },
// // //     update,
// // //     { new: true, upsert: true, setDefaultsOnInsert: true }
// // //   );
// // //   res.json({ success: true, data: s });
// // // };

// // // exports.uploadQr = async (req, res) => {
// // //   if (!req.file) return res.status(400).json({ success: false, message: 'QR image required' });
// // //   const url = `/uploads/fees/${req.file.filename}`;
// // //   const s = await Setting.findOneAndUpdate(
// // //     { key: 'payment' },
// // //     { qrImageUrl: url, updatedBy: req.admin._id },
// // //     { new: true, upsert: true, setDefaultsOnInsert: true }
// // //   );
// // //   res.json({ success: true, data: s });
// // // };

// // // controllers/settingController.js
// // const Setting = require('../models/Setting');

// // // ── Default values (কিছু না থাকলে) ──
// // const DEFAULTS = {
// //   bkash: '',
// //   nagad: '',
// //   rocket: '',
// //   instructions: '',
// //   qrImageUrl: '',      // 👈 frontend যেভাবে খুঁজছে
// //   qrPublicId: ''
// // };

// // // ── Internal helper ──
// // const ensureSetting = async () => {
// //   let s = await Setting.findOne({ key: 'payment' });
// //   if (!s) {
// //     s = await Setting.create({ key: 'payment', data: { ...DEFAULTS } });
// //   }
// //   // missing keys যোগ করুন
// //   let changed = false;
// //   for (const k of Object.keys(DEFAULTS)) {
// //     if (s.data[k] === undefined) {
// //       s.data[k] = DEFAULTS[k];
// //       changed = true;
// //     }
// //   }
// //   if (changed) {
// //     s.markModified('data');
// //     await s.save();
// //   }
// //   return s;
// // };

// // // ── Admin: get ──
// // exports.get = async (req, res) => {
// //   try {
// //     const s = await ensureSetting();
// //     res.json({ success: true, data: s.data });
// //   } catch (e) {
// //     console.error('Setting get error:', e);
// //     res.status(500).json({ success: false, message: e.message });
// //   }
// // };

// // // ── Admin: update ──
// // exports.update = async (req, res) => {
// //   try {
// //     const s = await ensureSetting();
// //     s.data = { ...s.data, ...req.body };
// //     s.markModified('data');
// //     await s.save();
// //     res.json({ success: true, data: s.data });
// //   } catch (e) {
// //     res.status(500).json({ success: false, message: e.message });
// //   }
// // };

// // // ── Admin: QR upload ──
// // exports.uploadQr = async (req, res) => {
// //   try {
// //     console.log('━━━ QR Upload ━━━');
// //     console.log('File:', req.file ? {
// //       path: req.file.path,
// //       filename: req.file.filename,
// //       mimetype: req.file.mimetype,
// //       size: req.file.size
// //     } : '❌ NO FILE');

// //     if (!req.file) {
// //       return res.status(400).json({ success: false, message: 'QR image required' });
// //     }

// //     const s = await ensureSetting();

// //     // পুরনো QR delete (Cloudinary থেকে)
// //     if (s.data.qrPublicId) {
// //       try {
// //         const cloudinary = require('../config/cloudinary');
// //         await cloudinary.uploader.destroy(s.data.qrPublicId, { resource_type: 'image' });
// //       } catch (err) {
// //         console.warn('Old QR delete failed:', err.message);
// //       }
// //     }

// //     // ✅ নতুন QR URL + publicId
// //     s.data.qrImageUrl = req.file.path;       // 👈 frontend এ যেভাবে খুঁজছে
// //     s.data.qrPublicId = req.file.filename;
// //     s.markModified('data');
// //     await s.save();

// //     console.log('✅ QR saved:', s.data.qrImageUrl);
// //     res.json({ success: true, data: s.data });
// //   } catch (e) {
// //     console.error('QR upload error:', e);
// //     res.status(500).json({ success: false, message: e.message });
// //   }
// // };

// // // ── Public: student frontend এ দেখানোর জন্য ──
// // exports.getPublic = async (req, res) => {
// //   try {
// //     const s = await Setting.findOne({ key: 'payment' });
// //     const data = s?.data || {};

// //     // শুধু public-safe field পাঠান
// //     const publicData = {
// //       bkash: data.bkash || '',
// //       nagad: data.nagad || '',
// //       rocket: data.rocket || '',
// //       instructions: data.instructions || '',
// //       qrImageUrl: data.qrImageUrl || ''    // 👈 frontend যেভাবে খুঁজছে
// //     };

// //     console.log('Public payment settings requested:', publicData);

// //     res.json({ success: true, data: publicData });
// //   } catch (e) {
// //     console.error('getPublic error:', e);
// //     res.status(500).json({ success: false, message: e.message });
// //   }
// // };

// // controllers/settingController.js
// const Setting = require('../models/Setting');

// // ── Default values ──
// const DEFAULTS = {
//   bkash: '',
//   nagad: '',
//   rocket: '',
//   instructions: '',
//   qrImageUrl: '',
//   qrPublicId: ''
// };

// // ── Safe getter — DB থেকে data always object করে দেয় ──
// const ensureSetting = async () => {
//   let s = await Setting.findOne({ key: 'payment' });

//   // Case 1: Setting নেই — নতুন তৈরি
//   if (!s) {
//     s = await Setting.create({ key: 'payment', data: { ...DEFAULTS } });
//     return s;
//   }

//   // Case 2: s.data undefined / null / array / string — সব normalize করি
//   let data = s.data;

//   if (data === undefined || data === null || typeof data !== 'object' || Array.isArray(data)) {
//     data = {};
//   }

//   // Case 3: missing keys যোগ করি
//   let changed = false;
//   for (const k of Object.keys(DEFAULTS)) {
//     if (data[k] === undefined) {
//       data[k] = DEFAULTS[k];
//       changed = true;
//     }
//   }

//   // Case 4: পুরনো qrUrl থাকলে migrate করি
//   if (data.qrUrl && !data.qrImageUrl) {
//     data.qrImageUrl = data.qrUrl;
//     delete data.qrUrl;
//     changed = true;
//   }

//   if (changed) {
//     s.data = data;
//     s.markModified('data');
//     await s.save();
//   }

//   return s;
// };

// // ── Admin: get ──
// exports.get = async (req, res) => {
//   try {
//     const s = await ensureSetting();
//     res.json({ success: true, data: s.data });
//   } catch (e) {
//     console.error('Setting get error:', e);
//     res.status(500).json({ success: false, message: e.message });
//   }
// };

// // ── Admin: update ──
// exports.update = async (req, res) => {
//   try {
//     const s = await ensureSetting();

//     // req.body একটা object কি না চেক
//     const incoming = (req.body && typeof req.body === 'object' && !Array.isArray(req.body))
//       ? req.body
//       : {};

//     s.data = { ...s.data, ...incoming };
//     s.markModified('data');
//     await s.save();

//     res.json({ success: true, data: s.data });
//   } catch (e) {
//     console.error('Setting update error:', e);
//     res.status(500).json({ success: false, message: e.message });
//   }
// };

// // ── Admin: QR upload ──
// exports.uploadQr = async (req, res) => {
//   try {
//     console.log('━━━ QR Upload ━━━');
//     console.log('File:', req.file ? {
//       path: req.file.path,
//       filename: req.file.filename,
//       mimetype: req.file.mimetype,
//       size: req.file.size
//     } : '❌ NO FILE');

//     if (!req.file) {
//       return res.status(400).json({ success: false, message: 'QR image required' });
//     }

//     const s = await ensureSetting();

//     // পুরনো QR Cloudinary থেকে delete
//     if (s.data.qrPublicId) {
//       try {
//         const cloudinary = require('../config/cloudinary');
//         await cloudinary.uploader.destroy(s.data.qrPublicId, { resource_type: 'image' });
//       } catch (err) {
//         console.warn('Old QR delete failed:', err.message);
//       }
//     }

//     s.data.qrImageUrl = req.file.path;
//     s.data.qrPublicId = req.file.filename;
//     s.markModified('data');
//     await s.save();

//     console.log('✅ QR saved:', s.data.qrImageUrl);
//     res.json({ success: true, data: s.data });
//   } catch (e) {
//     console.error('QR upload error:', e);
//     res.status(500).json({ success: false, message: e.message });
//   }
// };

// // ── Public: student frontend ──
// exports.getPublic = async (req, res) => {
//   try {
//     const s = await Setting.findOne({ key: 'payment' });
//     const data = (s?.data && typeof s.data === 'object' && !Array.isArray(s.data))
//       ? s.data
//       : {};

//     res.json({
//       success: true,
//       data: {
//         bkash: data.bkash || '',
//         nagad: data.nagad || '',
//         rocket: data.rocket || '',
//         instructions: data.instructions || '',
//         qrImageUrl: data.qrImageUrl || data.qrUrl || ''
//       }
//     });
//   } catch (e) {
//     console.error('getPublic error:', e);
//     res.status(500).json({ success: false, message: e.message });
//   }
// };

// controllers/settingController.js
const Setting = require('../models/Setting');

const DEFAULTS = {
  bkash: '',
  nagad: '',
  rocket: '',
  instructions: '',
  qrImageUrl: '',
  qrPublicId: ''
};

// ── Safe Setting fetch — key mismatch handle করে ──
const ensureSetting = async () => {
  // ✅ findAll ব্যবহার করি যাতে সব পাই
  const all = await Setting.find({ key: 'payment' }).sort('createdAt');

  // যদি একাধিক থাকে — সবচেয়ে পুরনো / valid টা রাখি
  if (all.length > 1) {
    console.warn(`⚠️ Found ${all.length} settings with key="payment", cleaning up...`);

    // কোনটায় data আছে সেটা খুঁজি
    let keeper = all.find(s => s.data && (
      s.data.qrImageUrl || s.data.bkash || s.data.nagad || s.data.rocket
    )) || all[0];

    // বাকিগুলো delete
    for (const s of all) {
      if (String(s._id) !== String(keeper._id)) {
        await Setting.findByIdAndDelete(s._id);
        console.log('🗑️ Deleted duplicate:', s._id);
      }
    }
    console.log('✅ Kept:', keeper._id);

    // keeper normalize করি
    return keeper;
  }

  let s = all[0];

  // না থাকলে তৈরি
  if (!s) {
    s = await Setting.create({ key: 'payment', data: { ...DEFAULTS } });
    console.log('✅ Created new setting');
    return s;
  }

  // data normalize
  let data = s.data;
  if (data === undefined || data === null || typeof data !== 'object' || Array.isArray(data)) {
    data = {};
  }

  let changed = false;
  for (const k of Object.keys(DEFAULTS)) {
    if (data[k] === undefined) {
      data[k] = DEFAULTS[k];
      changed = true;
    }
  }

  if (data.qrUrl && !data.qrImageUrl) {
    data.qrImageUrl = data.qrUrl;
    delete data.qrUrl;
    changed = true;
  }

  if (changed) {
    s.data = data;
    s.markModified('data');
    await s.save();
  }

  return s;
};

// ── Admin: get ──
exports.get = async (req, res) => {
  try {
    const s = await ensureSetting();
    console.log('━━━ Admin GET ━━━');
    console.log('data:', JSON.stringify(s.data, null, 2));
    res.json({ success: true, data: s.data });
  } catch (e) {
    console.error('Setting get error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── Admin: update ──
exports.update = async (req, res) => {
  try {
    const s = await ensureSetting();
    const incoming = (req.body && typeof req.body === 'object' && !Array.isArray(req.body))
      ? req.body
      : {};

    s.data = { ...s.data, ...incoming };
    s.markModified('data');
    await s.save();

    console.log('━━━ Admin UPDATE ━━━');
    console.log('data:', JSON.stringify(s.data, null, 2));

    res.json({ success: true, data: s.data });
  } catch (e) {
    console.error('Setting update error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── Admin: QR upload ──
exports.uploadQr = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'QR image required' });
    }

    const s = await ensureSetting();

    // পুরনো QR delete
    if (s.data.qrPublicId) {
      try {
        const cloudinary = require('../config/cloudinary');
        await cloudinary.uploader.destroy(s.data.qrPublicId, { resource_type: 'image' });
      } catch (err) {
        console.warn('Old QR delete failed:', err.message);
      }
    }

    s.data.qrImageUrl = req.file.path;
    s.data.qrPublicId = req.file.filename;
    s.markModified('data');
    await s.save();

    console.log('━━━ QR UPLOAD ━━━');
    console.log('qrImageUrl:', s.data.qrImageUrl);

    res.json({ success: true, data: s.data });
  } catch (e) {
    console.error('QR upload error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── Public: student frontend ──
exports.getPublic = async (req, res) => {
  try {
    const s = await ensureSetting();

    const data = s.data || {};

    const publicData = {
      bkash: data.bkash || '',
      nagad: data.nagad || '',
      rocket: data.rocket || '',
      instructions: data.instructions || '',
      qrImageUrl: data.qrImageUrl || data.qrUrl || ''
    };

    console.log('━━━ Public GET ━━━');
    console.log('Sending:', publicData);

    res.json({ success: true, data: publicData });
  } catch (e) {
    console.error('getPublic error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};