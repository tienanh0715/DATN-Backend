
const express = require('express')
const router = express.Router()
let checkoutsCtrl = require('../controllers/CheckoutsController');
const verifyToken = require('../middleware/auth');

router.route('/checkouts')
    .get(verifyToken,checkoutsCtrl.get)

router.route('/checkouts/date')
    .post(verifyToken,checkoutsCtrl.getByDate);

module.exports = router;