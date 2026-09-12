const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensure = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const storage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', folder);
    ensure(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (types) => (req, file, cb) => {
  if (types.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type'));
};

exports.uploadResultPdf = multer({
  storage: storage('results'),
  fileFilter: fileFilter(['application/pdf']),
  limits: { fileSize: 10 * 1024 * 1024 }
});

exports.uploadScreenshot = multer({
  storage: storage('fees'),
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
  limits: { fileSize: 5 * 1024 * 1024 }
});

exports.uploadPhoto = multer({
  storage: storage('students'),
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
  limits: { fileSize: 2 * 1024 * 1024 }
});

exports.uploadQr = multer({
  storage: storage('fees'),
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
  limits: { fileSize: 3 * 1024 * 1024 }
}).single('qr');