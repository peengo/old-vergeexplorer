const express = require('express');
const router = express.Router();

const config = require('./../config.js');
const lib = require('./../lib/lib.js');

router.get('/', async (req, res, next) => {
    try {
        peers = await lib.getPeers();

        res.render('peers', { peers });
    } catch (e) {
        console.log(e)

        const $ = req.app.locals.$;
        const error = new Error($.ERROR);
        next(error);
    }
});

module.exports = router;