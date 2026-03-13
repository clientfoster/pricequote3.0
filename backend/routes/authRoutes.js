const express = require('express');
const router = express.Router();
const { authUser, acceptInvite, requestPasswordReset, resetPassword } = require('../controllers/authController');

router.post('/login', authUser);
router.post('/accept-invite', acceptInvite);
router.post('/setup', require('../controllers/authController').setupSuperAdmin);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
