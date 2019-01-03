const express = require('express');
const router = express.Router();

const config = require('./../config.js');

router.get('/', async (req, res, next) => {
    res.render('donations');
});

module.exports = router;