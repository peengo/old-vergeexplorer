const express = require('express');
const router = express.Router();

const config = require('./../config.js');
const lib = require('./../lib/lib.js');

//JSON SEARCH
router.post('/', async (req, res) => {
	try {
		const search = req.body.search.trim();
		const blocks = req.app.locals.blocks;
		const txs = req.app.locals.txs;

		// log search queries to db
		const searchCol = req.app.locals.search;
		await searchCol.insertOne({
			time: new Date().toLocaleString(),
			ip: req.headers['x-real-ip'],
			search: search.slice(0, 99),
			user_agent: req.headers['user-agent']
		});

		const rpc = req.app.locals.rpc;

		const $ = req.app.locals.$;

		// INT (block height)
		if (lib.isPositiveInteger(search)) {

			try {
				const block = await rpc.call('getblockbynumber', Number(search), true);
				res.json({ redirect: '/block/' + block.hash })
			} catch (e) {
				res.json({ error: $.BLOCK_NOT_FOUND })
			}
			// Hash (blockhash / txid)
		} else if (lib.isValidHash(search)) {

			try {
				const block = await rpc.getBlock(search);
				res.json({ redirect: '/block/' + block.hash })
			} catch (e) {
				const tx = await txs.findOne({ txid: search });
				if (tx != null) {
					res.json({ redirect: '/tx/' + tx.txid })
				} else {
					res.json({ error: $.BLOCK_TX_HASH_NOT_FOUND })
				}
			}
			// Address
		} else if (lib.isValidAddress(search)) {
			const address = await txs.findOne({ 'vout.scriptPubKey.addresses': search });

			if (address != null) {
				res.json({ redirect: '/address/' + search })
			} else {
				res.json({ error: $.ADDRESS_NOT_FOUND })
			}
			// Everything else
		} else {
			res.json({ error: $.INVALID_SEARCH_PARAMETER })
		}
	} catch (e) {
		console.log(e);
	}
});

module.exports = router;