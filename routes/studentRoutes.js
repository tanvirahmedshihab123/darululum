const router = require('express').Router();
const { studentAuth } = require('../middleware/auth');
const { uploadScreenshot } = require('../middleware/upload');
const c = require('../controllers/studentPortalController');
const attC = require('../controllers/attendanceController');
const settingC = require('../controllers/settingController');
const feeC = require('../controllers/feeController')

// -------- Public --------
router.get('/public/branches-classes', c.publicBranches);
router.post('/auth/login', c.login);


router.get('/public/payment-settings', settingC.getPublic);   // 🆕


// -------- Protected --------
router.use(studentAuth);

router.get('/profile', c.profile);
router.get('/attendance', attC.myMonthly);
router.get('/attendance/pdf', attC.attendancePdf);
router.get('/results', c.results);
router.get('/fees', c.fees);
router.post('/fees/submit', uploadScreenshot.single('screenshot'), c.submitFee);
router.get('/notices', c.notices);
router.post('/fees/request-advance', c.requestAdvance);      // 🆕
router.get('/fees/:id/receipt', feeC.receiptPdf);

module.exports = router;