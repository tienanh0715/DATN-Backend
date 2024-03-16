
const express = require('express')
const router = express.Router()
let medicinesCtrl = require('../controllers/MedicinesController');
const verifyToken = require('../middleware/auth');

router.route('/medicines')
    .get(verifyToken,medicinesCtrl.get)
    .post(verifyToken,medicinesCtrl.store)
    .delete(verifyToken,medicinesCtrl.deletes);

router.route('/medicines/update-status')
    .put(verifyToken,medicinesCtrl.updateStatus)

router.route('/medicines/:id')
    .get(verifyToken,medicinesCtrl.detail)
    .put(verifyToken,medicinesCtrl.update)
    .delete(verifyToken,medicinesCtrl.delete);

module.exports = router;