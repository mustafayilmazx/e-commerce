const router = require('express').Router();
const branchController = require('../controllers/branchControllers.js');

router.get('/all', branchController.getBranchs);

module.exports = router;