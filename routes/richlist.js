const express = require('express');
const router = express.Router();

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

        res.render('richlist', { /*addresses,*/ getInfo });
    } catch (e) {
        console.log(e)

        const $ = req.app.locals.$;
        const error = new Error($.ERROR);
        next(error);
        //res.status(500).send($.ERROR);
    }
});

module.exports = router;