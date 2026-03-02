const express = require('express');
const router = express.Router();
const { createClient, getClients, updateClient, deleteClient } = require('../controllers/clientController');
const { protect, superAdmin } = require('../middleware/authMiddleware');

router.route('/').post(protect, superAdmin, createClient).get(protect, getClients);
router.route('/:id').put(protect, superAdmin, updateClient).delete(protect, superAdmin, deleteClient);

module.exports = router;
