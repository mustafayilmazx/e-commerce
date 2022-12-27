const router = require('express').Router();
const adminController = require('../controllers/adminControllers.js');
const middleware = require('../middlewares/index.js');


router.post('/login', adminController.adminLogin);
router.post('/register', adminController.adminRegister);
router.post('/set-discount', middleware.adminAuth, adminController.adminProductDiscount);
router.post('/set-monthly-least-discount-rate', middleware.adminAuth, adminController.changeMonthlyLeastDiscountRate);
router.get('/get-monthly-least-sold-products', adminController.getMonthlyLeastDiscountRate);
router.get('/get-top-ten-customers',middleware.adminAuth ,adminController.getTopTenCustomers);
router.post('/set-top-ten-customers-discount-rate', middleware.adminAuth, adminController.changeTopTenCustomersDiscountRate);
router.post('/delete-comment', middleware.adminAuth, adminController.deleteComment);
module.exports = router;