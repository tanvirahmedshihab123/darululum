const router = require('express').Router();
const { adminAuth, superAdmin } = require('../middleware/auth');
const { uploadResultPdf, uploadPhoto } = require('../middleware/upload');

const adminAuthC = require('../controllers/adminAuthController');
const branchC   = require('../controllers/branchController');
const classC    = require('../controllers/classController');
const studentC  = require('../controllers/studentController');
const attC      = require('../controllers/attendanceController');
const resultC   = require('../controllers/resultController');
const feeC      = require('../controllers/feeController');
const noticeC   = require('../controllers/noticeController');
const settingC = require('../controllers/settingController');
const { uploadQr } = require('../middleware/upload');

// -------- Public --------
router.post('/auth/register', adminAuthC.register);
router.post('/auth/login', adminAuthC.login);

// -------- Protected --------
router.use(adminAuth);
router.get('/auth/me', adminAuthC.me);

// Branches
router.post('/branches', superAdmin, branchC.create);
router.get('/branches', branchC.list);
router.put('/branches/:id', superAdmin, branchC.update);
router.delete('/branches/:id', superAdmin, branchC.remove);

// Classes
router.post('/classes', classC.create);
router.get('/classes', classC.list);
router.put('/classes/:id', classC.update);
router.delete('/classes/:id', classC.remove);

// Students
router.post('/students', uploadPhoto.single('photo'), studentC.create);
router.get('/students', studentC.list);
router.get('/students/:id', studentC.get);
router.put('/students/:id', uploadPhoto.single('photo'), studentC.update);
router.delete('/students/:id', studentC.remove);

// Attendance
router.post('/attendance/save', attC.saveMonthly);
router.post('/attendance/bulk', attC.saveBulk);
router.get('/attendance/class',  attC.classMonthly);
router.get('/attendance/pdf',    attC.attendancePdf);

// Results
router.post('/results', uploadResultPdf.single('pdf'), resultC.upload);
router.get('/results', resultC.list);
router.patch('/results/:id/publish', resultC.togglePublish);
router.delete('/results/:id', resultC.remove);

// Fees
router.post('/fees', feeC.create);
router.post('/fees/bulk', feeC.bulkCreate);
router.get('/fees', feeC.list);
router.patch('/fees/:id/verify', feeC.verify);

// Notices
router.post('/notices', noticeC.create);
router.get('/notices', noticeC.list);
router.put('/notices/:id', noticeC.update);
router.delete('/notices/:id', noticeC.remove);

router.post('/fees/bulk-advance', feeC.bulkAdvance);
router.get('/fees/:id/receipt', feeC.receiptPdf);

// Settings
router.get('/settings/payment', settingC.get);
router.put('/settings/payment', settingC.update);
router.post('/settings/payment/qr', uploadQr, settingC.uploadQr);

module.exports = router;