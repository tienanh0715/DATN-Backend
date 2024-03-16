
const express = require('express')
const router = express.Router()
let doctorsCtrl = require('../controllers/DoctorsController');
const verifyToken = require('../middleware/auth');

router.route('/doctors')
    .get(doctorsCtrl.get)
    .post(verifyToken,doctorsCtrl.store)
    .delete(verifyToken,doctorsCtrl.deletes);
    
router.route('/doctors/schedules/:userId')
    .put(verifyToken,doctorsCtrl.updateSchedule)
    
router.route('/doctors/:userId')
    .get(verifyToken,doctorsCtrl.detail)
    .put(verifyToken,doctorsCtrl.update)
    .delete(verifyToken,doctorsCtrl.delete);

module.exports = router;