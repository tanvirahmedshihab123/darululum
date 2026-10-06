// // const multer = require('multer');
// // const { CloudinaryStorage } = require('multer-storage-cloudinary');
// // const cloudinary = require('../config/cloudinary');

// // // ── Helper: Cloudinary storage for a folder ──
// // const cloudStorage = (folder, resourceType = 'auto', allowedFormats) =>
// //   new CloudinaryStorage({
// //     cloudinary,
// //     params: {
// //       folder: `madrasa/${folder}`,
// //       resource_type: resourceType,   // 'image' | 'raw' | 'video' | 'auto'
// //       allowed_formats: allowedFormats,
// //       transformation: resourceType === 'image'
// //         ? [{ width: 1200, crop: 'limit', quality: 'auto' }]
// //         : undefined
// //     }
// //   });

// // // ── File filters ──
// // const fileFilter = (types) => (req, file, cb) => {
// //   if (types.includes(file.mimetype)) cb(null, true);
// //   else cb(new Error(`Invalid file type: ${file.mimetype}`));
// // };

// // // ── Export multer instances ──

// // // Results (PDF) — 'raw' হিসেবে Cloudinary-তে যাবে
// // exports.uploadResultPdf = multer({
// //   storage: cloudStorage('results', 'raw', ['pdf']),
// //   fileFilter: fileFilter(['application/pdf']),
// //   limits: { fileSize: 10 * 1024 * 1024 }   // 10MB
// // });

// // // Fee screenshots (image)
// // exports.uploadScreenshot = multer({
// //   storage: cloudStorage('fees', 'image', ['jpg', 'jpeg', 'png', 'webp']),
// //   fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
// //   limits: { fileSize: 5 * 1024 * 1024 }
// // });

// // // Student photos
// // exports.uploadPhoto = multer({
// //   storage: cloudStorage('students', 'image', ['jpg', 'jpeg', 'png', 'webp']),
// //   fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
// //   limits: { fileSize: 2 * 1024 * 1024 }
// // });

// // // Payment QR (settings)
// // exports.uploadQr = multer({
// //   storage: cloudStorage('settings', 'image', ['jpg', 'jpeg', 'png', 'webp']),
// //   fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
// //   limits: { fileSize: 1 * 1024 * 1024 }
// // });

// // middleware/upload.js
// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('../config/cloudinary');

// const cloudStorage = (folder, resourceType = 'auto', allowedFormats) =>
//   new CloudinaryStorage({
//     cloudinary,
//     params: {
//       folder: `madrasa/${folder}`,
//       resource_type: resourceType,
//       allowed_formats: allowedFormats,
//       transformation: resourceType === 'image'
//         ? [{ width: 1200, crop: 'limit', quality: 'auto' }]
//         : undefined
//     }
//   });

// const fileFilter = (types) => (req, file, cb) => {
//   if (types.includes(file.mimetype)) cb(null, true);
//   else cb(new Error(`Invalid file type: ${file.mimetype}`));
// };

// // ✅ শুধু multer instance — .single() ছাড়া
// exports.uploadResultPdf = multer({
//   storage: cloudStorage('results', 'raw', ['pdf']),
//   fileFilter: fileFilter(['application/pdf']),
//   limits: { fileSize: 10 * 1024 * 1024 }
// });

// exports.uploadScreenshot = multer({
//   storage: cloudStorage('fees', 'image', ['jpg', 'jpeg', 'png', 'webp']),
//   fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
//   limits: { fileSize: 5 * 1024 * 1024 }
// });

// exports.uploadPhoto = multer({
//   storage: cloudStorage('students', 'image', ['jpg', 'jpeg', 'png', 'webp']),
//   fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
//   limits: { fileSize: 2 * 1024 * 1024 }
// });

// // ✅ এটাও শুধু instance — .single() এখানে না
// exports.uploadQr = multer({
//   storage: cloudStorage('settings', 'image', ['jpg', 'jpeg', 'png', 'webp']),
//   fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
//   limits: { fileSize: 1 * 1024 * 1024 }
// });

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// ── Cloudinary storage ──
const cloudStorage = (folder, resourceType = 'auto') =>
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: `madrasa/${folder}`,
      resource_type: resourceType,
      // PDF এর জন্য public_id explicit
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      format: file.mimetype === 'application/pdf' ? 'pdf' : undefined
    })
  });

const fileFilter = (types) => (req, file, cb) => {
  console.log('File received:', file.originalname, file.mimetype);   // 👈 debug
  if (types.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Invalid file type: ${file.mimetype}`));
};

// ── Result PDF (raw) ──
exports.uploadResultPdf = multer({
  storage: cloudStorage('results', 'raw'),
  fileFilter: fileFilter(['application/pdf']),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ── Screenshot / Photo / QR (image) ──
exports.uploadScreenshot = multer({
  storage: cloudStorage('fees', 'image'),
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
  limits: { fileSize: 5 * 1024 * 1024 }
});

exports.uploadPhoto = multer({
  storage: cloudStorage('students', 'image'),
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
  limits: { fileSize: 2 * 1024 * 1024 }
});

exports.uploadQr = multer({
  storage: cloudStorage('settings', 'image'),
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
  limits: { fileSize: 1 * 1024 * 1024 }
});


// Admission documents — photo + certificates
exports.uploadAdmission = multer({
  storage: cloudStorage('admissions', 'auto'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Multiple fields wrapper
exports.uploadAdmissionFields = exports.uploadAdmission.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'previousCertificate', maxCount: 1 },
]);