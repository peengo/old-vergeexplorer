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
		const txs = req.app.locals.txs;
		const tx = await txs.findOne({ txid: txid });

		if (tx === null) {
			res.render('index', { err: $.TX_NOT_FOUND });
			return;
		}

		const blockRpc = await rpc.getBlock(tx.blockhash);
		tx.confirmations = blockRpc.confirmations;

		res.render('tx', { tx });
	} catch (e) {
		console.log(e);

		const $ = req.app.locals.$;
		res.render('index', { err: $.TX_NOT_FOUND });
	}
});

module.exports = router;