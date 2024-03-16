
const express = require('express')
const router = express.Router()
let servicesCtrl = require('../controllers/ServicesController');
const verifyToken = require('../middleware/auth');
const {handleUpload} = require('../middleware/multer')

router.route('/services')
    .get(servicesCtrl.get)
    .post(verifyToken,servicesCtrl.store)
    .delete(verifyToken,servicesCtrl.deletes);

router.route('/services/update-status')
    .put(verifyToken,servicesCtrl.updateStatus)

router.route('/services/:id')
    .get(servicesCtrl.detail)
    .put(verifyToken,servicesCtrl.update)
    .delete(verifyToken,servicesCtrl.delete);

module.exports = router;