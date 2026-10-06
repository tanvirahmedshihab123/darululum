const router = require('express').Router();
const admissionC = require('../controllers/admissionController');
const { uploadAdmissionFields } = require('../middleware/upload');

// ── Admission (public) ──
router.get('/admission/branches-classes', admissionC.publicBranchesClasses);
router.post('/admission/apply', uploadAdmissionFields, admissionC.apply);
router.get('/admission/track/:trackingCode', admissionC.track);
router.get('/admission/track', admissionC.track);   // query-based

module.exports = router;