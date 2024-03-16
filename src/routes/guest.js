
const express = require('express')
const router = express.Router()
let guestsCtrl = require('../controllers/GuestsController');
const verifyToken = require('../middleware/auth');

router.route('/guests')
    .get(verifyToken,guestsCtrl.get)
    .post(verifyToken,guestsCtrl.store)
    .delete(verifyToken,guestsCtrl.deletes);

router.route('/guests/:userId')
    .get(verifyToken,guestsCtrl.detail)
    .put(verifyToken,guestsCtrl.update)
    .delete(verifyToken,guestsCtrl.delete);
    
router.route('/guests/register')
    .post(guestsCtrl.register);

module.exports = router;