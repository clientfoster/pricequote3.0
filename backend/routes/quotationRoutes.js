const express = require('express');
const router = express.Router();
const {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    deleteQuotation,
    getDashboardStats
} = require('../controllers/quotationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createQuotation).get(protect, getQuotations);
router.route('/stats').get(protect, getDashboardStats);
router
    .route('/:id')
    .get(protect, getQuotationById)
    .put(protect, updateQuotation)
    .delete(protect, deleteQuotation);

module.exports = router;
