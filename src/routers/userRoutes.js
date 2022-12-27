const router = require('express').Router();
const userController = require('../controllers/userControllers.js');
const middleware = require('../middlewares/index.js');


router.post('/register', userController.createUser);
router.post('/login', userController.loginUser);
router.post('/change-password',middleware.auth,userController.changePassword);
router.post('/change-mail',middleware.auth,userController.changeMail);
router.get('/orders',middleware.auth,userController.getOrders);
router.get('/cart',middleware.auth,userController.getCart);
router.post('/cart',middleware.auth,userController.addToCart);
router.delete('/cart',middleware.auth,userController.removeFromCart);
router.put('/cart',middleware.auth,userController.updateCart);
router.get('/address',middleware.auth,userController.getAddress);
router.post('/address',middleware.auth,userController.addAddress);
router.get('/credit-cards',middleware.auth,userController.getCreditCards);
router.post('/credit-cards',middleware.auth,userController.addCreditCard);
router.post('/favorites',middleware.auth,userController.addToFavorites);
router.delete('/favorites',middleware.auth,userController.RemoveFromFavorites);
router.post('/favorites-to-cart',middleware.auth,userController.favoritesToCart);
router.post('/select-address',middleware.auth,userController.selectAddress);
router.post('/make-comment',middleware.auth,userController.makeComment);
router.get('/comments',middleware.auth,userController.getComments);
router.put('/comments',middleware.auth,userController.updateComment);
router.delete('/comments',middleware.auth,userController.deleteComment);

module.exports = router;