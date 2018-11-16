const config = require('../config.js');
const Decimal = require('decimal.js-light');
const BitcoinRpc = require('bitcoin-rpc-promise');
Decimal.set({
	precision: config.precision,
	toExpNeg: config.toExpNeg,
});

const prepareTxs = block => {
	const txs = block.tx;
	txs.map(tx => {
		tx._id = tx.txid;
		tx.blockhash = block.hash;
		tx.confirmations = block.confirmations;
		tx.blocktime = block.time;
		tx.height = block.height;
	});

	return txs;
}

const prepareBlock = block => {
	block.tx = block.tx.map((tx) => tx.txid);
	block._id = block.height;

	return block;
}

// tx = tx object, txs = txs collection
const getInputAddresses = async (tx, txs, addr, addr_txs, blocks) => {
	let inputs = [];
	if (tx.vin[0].hasOwnProperty('coinbase')) {
		inputs.push({ coinbase: 1 });
	} else {
		for (let v of tx.vin) {
			const vin = await txs.findOne({ txid: v.txid });

			// console.log('\n', v.txid, '\n');
			// console.log('block hash:', vin.blockhash);

			if (vin === null) {
				let rpc = new BitcoinRpc(config.rpcUrl());

				console.log('tx not found in the DB:', v.txid);
				const transaction = await rpc.getTransaction(v.txid);
				console.log('block hash in the RPC:', transaction.blockhash);
				let block = await rpc.getBlock(transaction.blockhash, true); // true for detailed txs
				const dbBlock = await blocks.findOne({ height: block.height });
				console.log('block hash in the DB:', dbBlock.hash);
				console.log('height:', block.height);
				const invBlock = await rpc.getBlock(dbBlock.hash);

				if (invBlock.confirmations === 0 && (block.confirmations > invBlock.confirmations)) {
					console.log('INVALID BLOCK FOUND!');
					console.log('TIME', new Date().toLocaleString());
					// remove transactions from txs
					for (let dbTx of dbBlock.tx) {
						// remove from wallet balance
						const invAddrTxs = await addr_txs.find({ txid: dbTx }).toArray();
						for (let invTx of invAddrTxs) {
							const invAddress = await addr.findOne({ address: invTx.address });
							console.log(invAddress);

							const value = Decimal(invTx.value);

							let received = Decimal(invAddress.received);
							let sent = Decimal(invAddress.sent);
							let balance = Decimal(invAddress.balance);

							switch (invTx.type) {
								case 'vout':
									sent = sent.minus(value);
									invAddress.sent = sent.toString();

									balance = balance.plus(value);
									invAddress.balance = balance.toString();
									break;
								case 'vin':
									received = received.minus(value);
									invAddress.received = received.toString();

									balance = balance.minus(value);
									invAddress.balance = balance.toString();
									break;
								case 'both':
									if (value.isNegative()) {
										sent = sent.minus(value);
										invAddress.sent = sent.toString();

										balance = balance.plus(value);
										invAddress.balance = balance.toString();
									} else if (value.isPositive()) {
										received = received.minus(value);
										invAddress.received = received.toString();

										balance = balance.minus(value);
										invAddress.balance = balance.toString();
									}
									break;
								default:
									break;
							}
							console.log(invAddress);
						}

						console.log('removing all prepared txs (addr_txs):', dbTx);
						await addr_txs.deleteMany({ txid: dbTx });
						console.log('removing tx:', dbTx);
						await txs.deleteOne({ txid: dbTx });
					}

					// replace invalid block
					const transactions = prepareTxs(block);
					block = prepareBlock(block);

					const options = { upsert: true };
					console.log('replacing block:', dbBlock.hash, 'with', block.hash, 'at height:', block.height);
					const resBlock = await blocks.replaceOne({ height: block.height }, block, options);
					console.log('Block: ' + resBlock.ops[0].height + ' updated  ');

					console.log(block);
					console.log(transactions);

					// insert valid txs
					const resTx = await txs.insertMany(transactions);
					console.log(resTx.insertedCount, 'tx(s) inserted');

					// prepare the valid transaction
					for (let tx of transactions) {
						//await getInputAddresses(tx, txs, addr, addr_txs, blocks);
						await prepareVins(tx, txs, addr, addr_txs, blocks);
						await prepareVouts(tx, addr, addr_txs);
					}
				}

				// process.exit();
			} else {
				const address = vin.vout[v.vout].scriptPubKey.addresses[0];
				let value = vin.vout[v.vout].value.toString();

				if (inputs.length == 0) {
					inputs.push({
						address: address,
						value: value,
						time: tx.blocktime,
						txid: tx.txid
					});
				} else {
					let obj = inputs.find(input => input.address == address);
					if (obj == undefined) {
						inputs.push({
							address: address,
							value: value,
							time: tx.blocktime,
							txid: tx.txid
						});
					} else {
						let index = inputs.indexOf(obj);
						obj.value = Decimal(obj.value);
						value = Decimal(value);
						let sum = obj.value.plus(value);
						inputs.fill(obj.value = sum.toString(), index, index++);
					}
				}
			}
		}
	}

	return inputs;
}

// tx = tx object
const getRecipients = async tx => {
	let recipients = [];
	tx.vout.forEach(vout => {
		if (!(vout.scriptPubKey.type === 'nonstandard' || vout.scriptPubKey.type === 'nulldata')) {
			const address = vout.scriptPubKey.addresses[0];
			let value = vout.value.toString();

			if (recipients.length == 0) {
				recipients.push({
					address: address,
					value: value,
					time: tx.blocktime,
					txid: tx.txid
				});
			} else {
				let obj = recipients.find(recipient => recipient.address == address);
				if (obj == undefined) {
					recipients.push({
						address: address,
						value: value,
						time: tx.blocktime,
						txid: tx.txid
					});
				} else {
					let index = recipients.indexOf(obj);
					obj.value = Decimal(obj.value);
					value = Decimal(value);
					let sum = obj.value.plus(value);
					recipients.fill(obj.value = sum.toString(), index, index++);
				}
			}
			/*
			recipients.push({
				address: vout.scriptPubKey.addresses[0],
				value: vout.value.toString(),
				time: tx.blocktime,
				txid: tx.txid
			});
			*/
		}
	});
	return recipients;
}

// tx = tx object, (txs, addr, addr_tx) = collections
const prepareVins = async (tx, txs, addr, addr_txs, blocks) => {
	const inputs = await getInputAddresses(tx, txs, addr, addr_txs, blocks);

	if (!inputs[0].hasOwnProperty('coinbase')) {
		for (const input of inputs) {

			const address = input.address;
			let value = input.value.toString();

			let addressData = await addr.findOne({ address: address });

			if (addressData) {
				// if address exists
				value = Decimal(value);
				addressData.sent = Decimal(addressData.sent);
				addressData.received = Decimal(addressData.received);

				const sent = addressData.sent.plus(value);
				const balance = addressData.received.minus(sent);

				const updateAddress = {
					sent: sent.toString(),
					balance: balance.toString()
				}

				const txData = await addr_txs.findOne({ txid: tx.txid, address: address });
				if (txData) {
					// if address txs is found
					if (txData.type === 'vout') {

						const vout_value = Decimal(txData.value);
						value = vout_value.minus(value);

						const updateTx = {
							type: 'both',
							value: value.toString(),
							time: input.time
						}
						await addr_txs.updateOne({ txid: tx.txid, address: address }, { $set: updateTx });

						await addr.updateOne({ address: address }, { $set: updateAddress });
					}
				} else {
					// if address txs is not found
					const insertTx = {
						_id: address + '_' + tx.txid,
						txid: tx.txid,
						type: 'vin',
						value: value.toString(),
						time: input.time,
						address: address
					}
					await addr_txs.insertOne(insertTx);

					await addr.updateOne({ address: address }, { $set: updateAddress });
				}
			} else {
				// if address is not found
				const insertTx = {
					_id: address + '_' + tx.txid,
					txid: tx.txid,
					type: 'vin',
					value: value.toString(),
					time: input.time,
					address: address
				}
				await addr_txs.insertOne(insertTx);

				const insertAddress = {
					_id: address,
					address: address,
					sent: value.toString(),
					received: '0',
					balance: value.toString()
				}
				await addr.insertOne(insertAddress);
			}
		}
	}
}

const prepareVouts = async (tx, addr, addr_txs) => {
	const recipients = await getRecipients(tx);
	for (const recipient of recipients) {

		const address = recipient.address;
		let value = recipient.value.toString();

		let addressData = await addr.findOne({ address: address });

		if (addressData) {
			// if address exists
			value = Decimal(value);
			addressData.sent = Decimal(addressData.sent);
			addressData.received = Decimal(addressData.received);

			const received = addressData.received.plus(value);
			const balance = received.minus(addressData.sent);

			const updateAddress = {
				received: received.toString(),
				balance: balance.toString()
			}

			const txData = await addr_txs.findOne({ txid: tx.txid, address: address });
			if (txData) {
				// if address txs is found
				if (txData.type === 'vin') {

					const vin_value = Decimal(txData.value);
					value = value.minus(vin_value);

					const updateTx = {
						type: 'both',
						value: value.toString(),
						time: recipient.time
					}
					await addr_txs.updateOne({ txid: tx.txid, address: address }, { $set: updateTx });

					await addr.updateOne({ address: address }, { $set: updateAddress });
				}
			} else {
				// if address txs is not found
				const insertTx = {
					_id: address + '_' + tx.txid,
					txid: tx.txid,
					type: 'vout',
					value: value.toString(),
					time: recipient.time,
					address: address
				}
				await addr_txs.insertOne(insertTx);

				await addr.updateOne({ address: address }, { $set: updateAddress });
			}
		} else {
			// if address is not found
			const insertTx = {
				_id: address + '_' + tx.txid,
				txid: tx.txid,
				type: 'vout',
				value: value.toString(),
				time: recipient.time,
				address: address
			}
			await addr_txs.insertOne(insertTx);

			const insertAddress = {
				_id: address,
				address: address,
				sent: '0',
				received: value.toString(),
				balance: value.toString()
			}
			await addr.insertOne(insertAddress);
		}
	}
}

// for API
const getAllPagesFetched = (rows, count) => {
	(rows >= count - config.limit) ? all = true : all = false;
	return all;
}

const setAmountsOut = (transactions, shortHash) => {
	transactions.forEach(tx => {
		if (shortHash === true) tx.shortHash = tx.txid.substr(0, config.shortHash) + '...';
		let amountOut = Decimal('0');
		tx.vout.forEach(vout => {
			vout.value = Decimal(vout.value.toFixed(8));
			amountOut = amountOut.plus(vout.value);
		});
		tx.amountOut = amountOut.toString();
	});
}

const getPageData = (array, rows) => {
	return array.slice(rows, rows + config.limit);
}

/*
const getCalculatedConfirmations = (count, height) => {
	return (count - height) - 1
}
*/

const isPositiveInteger = (val) => {
	return config.intRegExp.test(val);
}

const isValidHash = (val) => {
	return config.hashRegExp.test(val);
}

const isValidAddress = (val) => {
	return config.addressRegExp.test(val);
}

module.exports = { prepareTxs, prepareBlock, getInputAddresses, getRecipients, prepareVins, prepareVouts, getAllPagesFetched, setAmountsOut, getPageData, /*getCalculatedConfirmations,*/ isPositiveInteger, isValidHash, isValidAddress };