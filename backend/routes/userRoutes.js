const express = require('express');
const router = express.Router();
const {
    inviteUser,
    getUsers,
    deleteUser,
    updateUserProfile,
} = require('../controllers/userController');
const { protect, superAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, superAdmin, getUsers);

router.route('/invite').post(protect, superAdmin, inviteUser);

router.route('/profile').put(protect, updateUserProfile);

router.route('/:id')
    .delete(protect, superAdmin, deleteUser);

module.exports = router;
