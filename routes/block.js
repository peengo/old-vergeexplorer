const express = require('express');
const router = express.Router();

const config = require('./../config.js');
const lib = require('./../lib/lib.js');

router.get('/:hash', async (req, res, next) => {
	try {
		const hash = req.params.hash;
		const $ = req.app.locals.$;
		const rpc = req.app.locals.rpc;

		if (!lib.isValidHash(hash)) {
			res.render('index', { err: $.NOT_VALID_HASH });
			return;
		}
		const blocks = req.app.locals.blocks;

		//const count = await blocks.count();
		const block = await blocks.findOne({ hash: hash });

		if (block === null) {
			res.render('index', { err: $.BLOCK_NOT_FOUND });
			return;
		}

		delete block._id;

		// OLD DB
		//block.confirmations = lib.getCalculatedConfirmations(count, block.height);
		// NEW rpc
		const blockRpc = await rpc.getBlock(block.hash);

		block.confirmations = blockRpc.confirmations;

		res.render('block', { block });
	} catch (e) {
		console.log(e);
		
		/*
		const $ = req.app.locals.$;
        const error = new Error($.ERROR);
		next(error);
		*/

		const $ = req.app.locals.$;
		res.render('index', { err: $.BLOCK_NOT_FOUND });
		
		//res.status(500).send($.ERROR);
	}
});

module.exports = router;