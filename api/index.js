const router = module.exports = require('express').Router();

// Project:
router.use('/classes', require('./classes').router);
router.use('/assignments', require('./assignments').router);
router.use('/users', require('./users').router);
router.use('/photos', require('./photos').router);
//router.use('/students', require('./students').router);
//router.use('/teachers', require('./teachers').router);