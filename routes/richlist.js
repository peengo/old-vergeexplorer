const express = require('express');
const router = express.Router();

const config = require('./../config.js');

router.get('/', async (req, res, next) => {
    try {
        const rpc = req.app.locals.rpc;
        let getInfo = await rpc.getInfo();

        let timestamp = null;

        if (config.usePrebuiltRichlist) {
            const rich = req.app.locals.richlist;
            let richlist = await rich.find().sort({ timestamp: -1 }).limit(1).toArray();
            (richlist[0] === undefined) ? timestamp = null : timestamp = richlist[0].timestamp;
        }

        res.render('richlist', { getInfo, timestamp });
    } catch (e) {
        console.log(e)

        const $ = req.app.locals.$;
        const error = new Error($.ERROR);
        next(error);
    }
});

module.exports = router;