
const express = require('express')
const router = express.Router()
let patientsCtrl = require('../controllers/PatientsController');
const verifyToken = require('../middleware/auth');

router.route('/patients')
    .get(verifyToken,patientsCtrl.get)
    .post(verifyToken,patientsCtrl.store)
    .delete(verifyToken,patientsCtrl.deletes);

router.route('/patients/:userId')
    .get(verifyToken,patientsCtrl.detail)
    .put(verifyToken,patientsCtrl.update)
    .delete(verifyToken,patientsCtrl.delete);

module.exports = router;