
const express = require('express')
const router = express.Router()
let reportsCtrl = require('../controllers/ReportController');
const verifyToken = require('../middleware/auth');

router.route('/report/accounts')
    .get(verifyToken,reportsCtrl.getAccount)
router.route('/report/income')
    .get(verifyToken,reportsCtrl.getIncome)
router.route('/report/patients')
    .get(verifyToken,reportsCtrl.getPatient)
router.route('/report/appointments')
    .post(reportsCtrl.getAppointment)
router.route('/report/allDoctor')
    .get(verifyToken,reportsCtrl.getAllDoctor)
router.route('/report/allPatient')
    .get(verifyToken,reportsCtrl.getAllPatient)    
    
module.exports = router;