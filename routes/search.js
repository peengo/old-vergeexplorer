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

			/*
			const block = await blocks.findOne({ height: Number(search) });
			if (block === null) {
				res.json({ error: $.BLOCK_NOT_FOUND })
			} else {
				res.json({ redirect: '/block/' + block.hash })
			}
			*/

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

			/*
			const block = await blocks.findOne({ hash: search });

			if (block != null) {
				res.json({ redirect: '/block/' + block.hash })
			} else {
				const tx = await txs.findOne({ txid: search });
				if (tx != null) {
					res.json({ redirect: '/tx/' + tx.txid })
				} else {
					res.json({ error: $.BLOCK_TX_HASH_NOT_FOUND })
				}
			}
			*/
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

/* OLD
router.post('/', async (req, res) => {
	try {
		const search = req.body.search;

		const blocks = req.app.locals.blocks;
		const txs = req.app.locals.txs;

		// Integer (block height)
		if (config.intRegExp.test(search)) {
			const block = await blocks.findOne({ height: Number(search) });

			if (block == null) {
				//res.render('index', { err: 'block not found' });
				res.redirect('/?e=1');
			} else {
				res.redirect('/block/' + block.hash);
			}
			// Hash (blockhash / txid)
		} else if (config.hashRegExp.test(search)) {
			const block = await blocks.findOne({ hash: search });

			if (block != null) {
				res.redirect('/block/' + block.hash);
			} else {
				const tx = await txs.findOne({ txid: search });
				if (tx != null) {
					res.redirect('/tx/' + tx.txid);
				} else {
					//res.render('index', { err: 'block / tx with that hash not found' });
					res.redirect('/?e=2');
				}
			}

			// Address
		} else if (config.addressRegExp.test(search)) {
			const address = await txs.findOne({ 'vout.scriptPubKey.addresses': search });

			if (address != null) {
				res.redirect('/address/' + search);
			} else {
				//res.render('index', { err: 'address not found' });
				res.redirect('/?e=3');
			}
		} else {
			// Everything else
			res.redirect('/');
		}
	} catch (e) {
		console.log(e);
	}
});
*/

module.exports = router;