const express = require('express');
const router = express.Router();

const config = require('./../config.js');

router.get('/', async (req, res, next) => {
    try {
        //const addr = req.app.locals.addr;
        //const info = req.app.locals.info;
        //const getInfo = await info.findOne();

        const rpc = req.app.locals.rpc;
        let getInfo = await rpc.getInfo();

        // const db = req.app.locals.db;
        // const addr = req.app.locals.addr;

        // const addresses = await addr.find().sort({ balance: -1 }).collation({ locale: "en_US", numericOrdering: true }).limit(100).toArray();

        // addresses.map((address, index) => {
        //     address.index = index + 1;
        // });

        let timestamp = null;

        if (config.usePrebuiltRichlist) {
            const rich = req.app.locals.richlist;
            let richlist = await rich.find().sort({ timestamp: -1 }).limit(1).toArray();
            (richlist[0] === undefined) ? timestamp = null : timestamp = richlist[0].timestamp;
        }

        res.render('richlist', { /*addresses,*/ getInfo, timestamp });
    } catch (e) {
        console.log(e)

        const $ = req.app.locals.$;
        const error = new Error($.ERROR);
        next(error);
        //res.status(500).send($.ERROR);
    }
});

module.exports = router;