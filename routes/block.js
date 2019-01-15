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

		const block = await rpc.getBlock(hash);

		res.render('block', { block });
	} catch (e) {
		console.log(e);

		const $ = req.app.locals.$;
		res.render('index', { err: $.BLOCK_NOT_FOUND });
	}
});

module.exports = router;