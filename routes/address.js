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
		const addr = db.collection('addr');
		const addr_txs = db.collection('addr_txs');

		const data = await addr.findOne({ address: address });

		if (data === null) {
			res.render('index', { err: $.ADDRESS_NOT_FOUND });
			return;
		}

		const count = await addr_txs.find({ address: address }).count();

		/*
		const txs = await addr_txs.find({ address: address }).sort({ time: -1 }).toArray();

		// for template logic
		txs.forEach(tx => {
			tx.value = Decimal(tx.value);
			tx.negative = tx.value.isneg();
			tx.value = tx.value.abs().toString();
		});
		txs.map(tx => { if (tx.type == 'vin') tx.vin = true });
		txs.map(tx => { if (tx.type == 'both') tx.both = true });
		*/

		res.render('address', { data, count });
	} catch (e) {
		console.log(e);
		
		const $ = req.app.locals.$;
        const error = new Error($.ERROR);
        next(error);
		
		//res.status(500).send($.ERROR);
	}
});

router.get('/old/:address', async (req, res) => {
	try {
		const address = req.params.address;

		if (!config.addressRegExp.test(address)) {
			res.render('index', { err: 'not a valid address format!' });
			return;
		}

		const addr = req.app.locals.addr;
		const data = await addr.findOne({ address: address });

		if (data === null) {
			res.render('index', { err: 'address not found!' });
			return;
		}

		const txs = data.txs;
		txs.sort((a, b) => b.time - a.time);

		txs.forEach((tx, i) => {
			if (i < txs.length - 1) {
				if (tx.txid == txs[i + 1].txid) {
					let value = Decimal(tx.value);
					let nextValue = Decimal(txs[i + 1].value);

					if (txs[i + 1].type === "vout") {
						tx.value = nextValue.minus(value);
					} else {
						tx.value = value.minus(nextValue);
					}

					tx.type = 'both';
					txs.splice(i + 1, 1);
					tx.negative = tx.value.isneg();
					tx.value = tx.value.abs().toString();
				}
			}
		});

		// for template logic
		txs.map(tx => { if (tx.type == 'vin') tx.vin = true });
		txs.map(tx => { if (tx.type == 'both') tx.both = true });


		// From Satoshis
		// data.sent = data.sent / 100000000;
		// data.received = data.received / 100000000;
		// data.balance = data.balance / 100000000;

		// txs.map(tx => {
		// 	tx.value = tx.value / 100000000;
		// });

		res.render('oldaddress', { data, txs });
	} catch (e) {
		console.log(e);
	}
});

module.exports = router;