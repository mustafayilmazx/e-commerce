const router = require('express').Router();
const productControllers = require('../controllers/productControllers.js');

router.get('/', productControllers.getProducts);

module.exports = router;