
const express = require('express')
const router = express.Router()
let reviewsCtrl = require('../controllers/ReviewsController');
const verifyToken = require('../middleware/auth');
const {handleUpload} = require("../middleware/multer")

router.route('/reviews')
    .get(reviewsCtrl.get)
    .post(verifyToken,reviewsCtrl.store);
router.route('/reviews/re-examine')
    .post(verifyToken,reviewsCtrl.reExamine);
router.route('/reviews/date')
    .post(reviewsCtrl.getByDate);

router.route('/reviews/appointment/:appointmentId')
    .get(reviewsCtrl.getByAppointmentId);
router.route('/reviews/doctor/:doctorId')
    .get(reviewsCtrl.getByDoctorId);
router.route('/reviews/:reviewId')
    .get(verifyToken,reviewsCtrl.detail)
    .put(verifyToken,reviewsCtrl.update)
    .delete(verifyToken,reviewsCtrl.delete);
router.route('/review/update/:reviewId')
    .post([verifyToken,handleUpload],reviewsCtrl.updateInfo)



module.exports = router;