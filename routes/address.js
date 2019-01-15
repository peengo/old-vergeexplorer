const express = require('express');
const router = express.Router();

const config = require('./../config.js');
const lib = require('./../lib/lib.js');

const Decimal = require('decimal.js-light');
Decimal.set({
	precision: config.precision,
	toExpNeg: config.toExpNeg,
});

router.get('/:address', async (req, res, next) => {
	try {
		const address = req.params.address;

		const $ = req.app.locals.$;

		if (!lib.isValidAddress(address)) {
			res.render('index', { err: $.NOT_VALID_ADDRESS });
			return;
		}

		const db = req.app.locals.db;
		const addr = req.app.locals.addr;
		const addr_txs = req.app.locals.addr_txs;

		const data = await addr.findOne({ address: address });

		if (data === null) {
			res.render('index', { err: $.ADDRESS_NOT_FOUND });
			return;
		}

		const count = await addr_txs.find({ address: address }).count();
		const balanceIsNeg = Decimal(data.balance).isNegative() && config.hideNegativeBalanceAddress;

		res.render('address', { data, count, balanceIsNeg });
	} catch (e) {
		console.log(e);

		const $ = req.app.locals.$;
		const error = new Error($.ERROR);
		next(error);
	}
});

module.exports = router;