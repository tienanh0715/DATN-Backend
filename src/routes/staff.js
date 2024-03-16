
const express = require('express')
const router = express.Router()
let staffCtrl = require('../controllers/StafffsController');
const verifyToken = require('../middleware/auth');

router.route('/staffs')
    .get(verifyToken,staffCtrl.get)
    .post(verifyToken,staffCtrl.store)
    .delete(verifyToken,staffCtrl.deletes);

router.route('/staffs/:userId')
    .get(verifyToken,staffCtrl.detail)
    .put(verifyToken,staffCtrl.update)
    .delete(verifyToken,staffCtrl.delete);
    
module.exports = router;