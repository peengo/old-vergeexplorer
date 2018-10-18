const express = require('express');
const router = express.Router();

const config = require('./../config.js');
const lib = require('./../lib/lib.js');

const Decimal = require('decimal.js-light');
Decimal.set({
    precision: config.precision,
    toExpNeg: config.toExpNeg,
});

// JSON INFO
router.get('/info', async (req, res, next) => {
    try {
        // OLD db
        //const info = req.app.locals.info;
        //let getInfo = await info.findOne();

        // NEW rpc
        const rpc = req.app.locals.rpc;
        let getInfo = await rpc.getInfo();

        const blocks = req.app.locals.blocks;
        const count = await blocks.count();

        getInfo = {
            count: count,
            blocks: getInfo.blocks,
            moneysupply: getInfo.moneysupply,
            paytxfee: getInfo.paytxfee
        }

        res.json(getInfo);
    } catch (e) {
        console.log(e);
        const $ = req.app.locals.$;
        res.status(500).json({ err: $.ERROR });
    }
});

// JSON BLOCK
router.get('/block/:hash', async (req, res) => {
    try {
        const hash = req.params.hash;
        const $ = req.app.locals.$;
        const rpc = req.app.locals.rpc;

        if (!lib.isValidHash(hash)) {
            res.json({ err: $.NOT_VALID_HASH });
        }

        // from db + rpc
        /*
        const blocks = req.app.locals.blocks;
        //const count = await blocks.count();
        const block = await blocks.findOne({ hash: hash });

        if (block === null) {
            res.json({ err: $.BLOCK_NOT_FOUND });
        }

        delete block._id;
        // OLD DB
        //block.confirmations = lib.getCalculatedConfirmations(count, block.height);
        // NEW rpc
        const blockRpc = await rpc.getBlock(block.hash);
        block.confirmations = blockRpc.confirmations;
        */

        const block = await rpc.getBlock(hash);

        res.json(block);
    } catch (e) {
        console.log(e);
    }
});

// JSON TX
router.get('/tx/:txid', async (req, res) => {
    try {
        const txid = req.params.txid;
        const $ = req.app.locals.$;
        const rpc = req.app.locals.rpc;

        if (!lib.isValidHash(txid)) {
            res.json({ err: $.NOT_VALID_TXID });
        }

        const blocks = req.app.locals.blocks;
        const txs = req.app.locals.txs;
        const count = await blocks.count();
        const tx = await txs.findOne({ txid: txid });

        if (tx === null) {
            res.json({ err: $.TX_NOT_FOUND });
        }
        delete tx._id;
        // OLD db
        //tx.confirmations = lib.getCalculatedConfirmations(count, tx.height);
        // NEW rpc
        const blockRpc = await rpc.getBlock(tx.blockhash);
        tx.confirmations = blockRpc.confirmations;

        res.json(tx);
    } catch (e) {
        console.log(e);
    }
});

// JSON CONFIRMATIONS
router.get('/confirmations/:hash', async (req, res) => {
    try {
        const hash = req.params.hash;
        const $ = req.app.locals.$;
        const rpc = req.app.locals.rpc;

        if (!lib.isValidHash(hash)) {
            res.json({ err: $.NOT_VALID_HASH });
        }

        const blocks = req.app.locals.blocks;
        const count = await blocks.count();
        const block = await blocks.findOne({ hash: hash });

        if (block === null) {
            res.json({ err: $.BLOCK_NOT_FOUND });
        }

        // OLD db
        //block.confirmations = lib.getCalculatedConfirmations(count, block.height);
        // NEW rpc
        const blockRpc = await rpc.getBlock(block.hash);
        block.confirmations = blockRpc.confirmations;

        res.json({ confirmations: block.confirmations });
    } catch (e) {
        console.log(e);
    }
});

// HTML LATEST BLOCKS
router.get('/blocks/latest', async (req, res) => {
    try {
        const blocks = req.app.locals.blocks;
        const latestBlocks = await blocks.find().sort({ height: -1 }).limit(config.latest).toArray();
        res.render('blocks', { latestBlocks, layout: false });
    } catch (e) {
        console.log(e);
        const $ = req.app.locals.$;
        res.status(500).send($.ERROR);
    }
});

// HTML LATEST TXS
router.get('/txs/latest', async (req, res) => {
    try {
        const txs = req.app.locals.txs;
        const latestTxs = await txs.find().sort({ time: -1 }).limit(config.latest).toArray();
        lib.setAmountsOut(latestTxs);
        res.render('txs', { latestTxs, layout: false });
    } catch (e) {
        console.log(e);
        const $ = req.app.locals.$;
        res.status(500).send($.ERROR);
    }
});

// HTML BLOCKS TXS PAGER
router.get('/block/txs/:hash/:rows', async (req, res) => {
    try {
        const hash = req.params.hash;
        let rows = req.params.rows;

        const $ = req.app.locals.$;

        if (!lib.isValidHash(hash)) {
            res.send($.NOT_VALID_HASH);
            return;
        }

        if (!lib.isPositiveInteger(rows)) {
            res.send($.NOT_VALID_INT);
            return;
        }

        rows = Number(rows);

        const blocks = req.app.locals.blocks;
        const txs = req.app.locals.txs;

        const block = await blocks.findOne({ hash: hash });

        if (block === null) {
            res.send($.BLOCK_NOT_FOUND);
            return;
        }

        const txids = block.tx;
        const count = await txs.find({ txid: { $in: txids } }).count();
        const transactions = await txs.find({ txid: { $in: txids } }).sort({ time: -1 }).skip(rows).limit(config.limit).toArray();
        lib.setAmountsOut(transactions);
        const all = lib.getAllPagesFetched(rows, count);

        res.render('block_txs', { transactions, all, layout: false });
    } catch (e) {
        console.log(e);
    }
});

// HTML TX INPUTS PAGER
router.get('/tx/inputs/:txid/:rows', async (req, res) => {
    try {
        const txid = req.params.txid;
        let rows = req.params.rows;

        const $ = req.app.locals.$;

        if (!lib.isValidHash(txid)) {
            res.send($.NOT_VALID_HASH);
            return;
        }

        if (!lib.isPositiveInteger(rows)) {
            res.send($.NOT_VALID_INT);
            return;
        }

        rows = Number(rows);

        const txs = req.app.locals.txs;
        const tx = await txs.findOne({ txid: txid });

        if (tx === null) {
            res.send($.TX_NOT_FOUND);
            return;
        }

        const allInputs = await lib.getInputAddresses(tx, txs);
        const count = allInputs.length;
        const inputs = lib.getPageData(allInputs, rows);
        const all = lib.getAllPagesFetched(rows, count);

        res.render('inputs', { inputs, all, count, $, layout: false });
    } catch (e) {
        console.log(e);
    }
});

// HTML TX RECIPIENTS PAGER 
router.get('/tx/recipients/:txid/:rows', async (req, res) => {
    try {
        const txid = req.params.txid;
        let rows = req.params.rows;

        const $ = req.app.locals.$;

        if (!lib.isValidHash(txid)) {
            res.send($.NOT_VALID_HASH);
            return;
        }

        if (!lib.isPositiveInteger(rows)) {
            res.send($.NOT_VALID_INT);
            return;
        }

        rows = Number(rows);

        const txs = req.app.locals.txs;
        const tx = await txs.findOne({ txid: txid });

        if (tx === null) {
            res.send($.TX_NOT_FOUND);
        }

        const allRecipients = await lib.getRecipients(tx);
        const count = allRecipients.length;
        const recipients = lib.getPageData(allRecipients, rows);
        const all = lib.getAllPagesFetched(rows, count);

        res.render('recipients', { recipients, all, count, $, layout: false });
    } catch (e) {
        console.log(e);
    }
});

// HTML ADDRESS TXS PAGER
router.get('/address/txs/:address/:rows', async (req, res) => {
    try {
        const address = req.params.address;
        let rows = req.params.rows;

        const $ = req.app.locals.$;

        if (!lib.isValidAddress(address)) {
            res.send($.NOT_VALID_ADDRESS);
            return;
        }
        if (!lib.isPositiveInteger(rows)) {
            res.send($.NOT_VALID_INT);
            return;
        }

        rows = Number(rows);

        const db = req.app.locals.db;
        const addr_txs = req.app.locals.addr_txs;

        const count = await addr_txs.find({ address: address }).count();
        const txs = await addr_txs.find({ address: address }).sort({ time: -1 }).skip(rows).limit(config.limit).toArray();
        const all = lib.getAllPagesFetched(rows, count);

        // for template logic
        txs.forEach(tx => {
            tx.value = Decimal(tx.value);
            tx.negative = tx.value.isneg();
            tx.value = tx.value.abs().toString();
        });
        txs.map(tx => { if (tx.type == 'vin') tx.vin = true });
        txs.map(tx => { if (tx.type == 'both') tx.both = true });

        res.render('address_txs', { txs, all, layout: false });
    } catch (e) {
        console.log(e);
    }
});

// HTML RICHLIST
router.get('/richlist', async (req, res) => {
    try {
        //const addr = req.app.locals.addr;
        // const info = req.app.locals.info;

        const db = req.app.locals.db;

        let addresses = [];

        if (config.usePrebuiltRichlist) {
            // USING PREBUILT DATA
            const rich = db.collection(config.rich);
            let richlist = await rich.find().sort({ timestamp: -1 }).limit(1).toArray();
            richlist = richlist[0];
            addresses = richlist.data;
        } else {
            // BUILDING ON THE GO
            const addr = req.app.locals.addr;
            addresses = await addr.find().sort({ balance: -1 }).collation({ locale: "en_US", numericOrdering: true }).limit(100).toArray();
            addresses.map((address, index) => {
                address.index = index + 1;
            });
        }

        res.render('newrichlist', { addresses, layout: false });
    } catch (e) {
        console.log(e)
    }
});

module.exports = router;