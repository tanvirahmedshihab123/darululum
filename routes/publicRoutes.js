
const router = require('express').Router();
const admissionC = require('../controllers/admissionController');
const announcementC = require('../controllers/announcementController');
const { uploadAdmissionFields } = require('../middleware/upload');
const emailC = require('../controllers/emailController'); // 👈 নতুন ইমপোর্ট

// ── Admission ──
router.get('/admission/branches-classes', admissionC.publicBranchesClasses);
router.post('/admission/apply', uploadAdmissionFields, admissionC.apply);
router.get('/admission/track/:trackingCode', admissionC.track);
router.get('/admission/track', admissionC.track);

// ── Public Announcements (frontend popup) ──
router.get('/announcements', announcementC.publicList);
router.post('/announcements/:id/view', announcementC.trackView);
router.post('/announcements/:id/dismiss', announcementC.trackDismiss);
router.post('/send-email', emailC.sendCustomEmail);

module.exports = router;