const router = require('express').Router();
const productControllers = require('../controllers/productControllers.js');

router.get('/', productControllers.getProducts);
router.get('/categories', productControllers.getCategories);

module.exports = router;