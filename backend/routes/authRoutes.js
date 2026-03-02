const express = require('express');
const router = express.Router();
const { authUser, acceptInvite } = require('../controllers/authController');

router.post('/login', authUser);
router.post('/accept-invite', acceptInvite);
router.post('/setup', require('../controllers/authController').setupSuperAdmin);

module.exports = router;
