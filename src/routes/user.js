
const express = require('express')
const router = express.Router()
let usersCtrl = require('../controllers/UsersController');
const verifyToken = require('../middleware/auth');
const { handleUploadSingle } = require("../middleware/multer")

router.route('/users/update-status')
    .put(verifyToken,usersCtrl.updateStatus)
router.route('/users/change-pw/:userId')
    .put(verifyToken,usersCtrl.update)
router.route('/users/update-info/:userId')
    .put(verifyToken,usersCtrl.changeInfo)
router.route('/guests/register')
    .post(usersCtrl.register);

module.exports = router;