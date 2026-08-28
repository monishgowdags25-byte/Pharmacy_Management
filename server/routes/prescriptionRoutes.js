const express = require('express');
const prescriptionController = require('../controllers/prescriptionController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

const prescriptionStaff = ['ADMIN', 'PHARMACIST', 'CASHIER'];
const verifiers = ['ADMIN', 'PHARMACIST'];

router.get('/', authorize(...prescriptionStaff), prescriptionController.getPrescriptions);
router.get('/:id', authorize(...prescriptionStaff), prescriptionController.getPrescriptionById);
router.post('/', authorize(...prescriptionStaff), prescriptionController.createPrescription);
router.put('/:id/status', authorize(...verifiers), prescriptionController.updatePrescriptionStatus);

module.exports = router;
