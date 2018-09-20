const express = require('express');
const router = express.Router();

const config = require('./../config.js');
const lib = require('./../lib/lib.js');

router.get('/:txid', async (req, res, next) => {
	try {
		const txid = req.params.txid;
		const rpc = req.app.locals.rpc;
		const $ = req.app.locals.$;

		if (!lib.isValidHash(txid)) {
			res.render('index', { err: $.NOT_VALID_TXID });
			return;
		}
		//const blocks = req.app.locals.blocks;
		const txs = req.app.locals.txs;
		//const count = await blocks.count();
		const tx = await txs.findOne({ txid: txid });

		if (tx === null) {
			res.render('index', { err: $.TX_NOT_FOUND });
			return;
		}

		// OLD db
		//tx.confirmations = lib.getCalculatedConfirmations(count, tx.height);
		// NEW rpc
		const blockRpc = await rpc.getBlock(tx.blockhash);
		tx.confirmations = blockRpc.confirmations;

		res.render('tx', { tx });
	} catch (e) {
		console.log(e);
		
		/*
		const $ = req.app.locals.$;
        const error = new Error($.ERROR);
		next(error);
		*/

		const $ = req.app.locals.$;
		res.render('index', { err: $.TX_NOT_FOUND });
		
		//res.status(500).send($.ERROR);
	}
});

module.exports = router;