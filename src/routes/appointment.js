
const express = require('express')
const router = express.Router()
let appointmentsCtrl = require('../controllers/AppointmentsController');
const verifyToken = require('../middleware/auth');
const {handleUpload} = require("../middleware/multer")

router.route('/appointments')
    .get(appointmentsCtrl.get)
    .post(verifyToken,appointmentsCtrl.store);
router.route('/appointments/re-examine')
    .post(verifyToken,appointmentsCtrl.reExamine);
router.route('/appointments/date')
    .post(appointmentsCtrl.getByDate);

router.route('/appointments/doctor')
    .post(appointmentsCtrl.getByDoctorId);
    
router.route('/appointments/:appointmentId')
    .get(verifyToken,appointmentsCtrl.detail)
    .put(verifyToken,appointmentsCtrl.update)
    .delete(verifyToken,appointmentsCtrl.delete);
router.route('/appointment/update/:appointmentId')
    .post([verifyToken,handleUpload],appointmentsCtrl.updateInfo)



module.exports = router;