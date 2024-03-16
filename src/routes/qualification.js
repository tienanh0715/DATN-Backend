
const express = require('express')
const router = express.Router()
let qrCodesCtrl = require('../controllers/AppointmentsController');
const verifyToken = require('../middleware/auth');

router.route('/qrcodes')
    .get(verifyToken,qrCodesCtrl.get)
    .post(verifyToken,qrCodesCtrl.store);

router.route('/qrcodes/:qrcodeId')
    .get(verifyToken,qrCodesCtrl.detail)
    .put(verifyToken,qrCodesCtrl.update)
    .delete(verifyToken,qrCodesCtrl.delete);
router.route('/qrcodes/verify')
    .post(verifyToken,qrCodesCtrl.verify);

module.exports = router;