'use strict';

const config = require('../config.js');
// const cli = require('../lib/cli.js');
const lib = require('../lib/lib.js');
const mongo = require('mongodb').MongoClient;
// const Big = require('big.js');
// Big.DP = 8;
// Big.RM = 0;
const Decimal = require('decimal.js-light');
Decimal.set({
    precision: config.precision,
    toExpNeg: config.toExpNeg,
});

console.time('test');

(async () => {
    try {
        //await cli.getinfo();
        const client = await mongo.connect(config.mongoURL);
        console.log('MongoDB connected');
        const db = client.db(config.db);
        const blocks = db.collection(config.blocks);
        const txs = db.collection(config.txs);
        const addresses = db.collection(config.addr);

        let height = 7000;

        while (true) {
            const block = await blocks.findOne({ height: height });
            const txids = block.tx;

            const transactions = await txs.find({ txid: { $in: txids } }).toArray();
            for (const tx of transactions) {
                // VINS
                // const vins = tx.vin;

                // for (const vin of vins) {
                const inputs = await lib.getInputAddresses(tx, txs);

                // if transaction is not a coinbase
                if (!inputs[0].hasOwnProperty('coinbase')) {
                    for (const input of inputs) {

                        //console.log(input.address + ' ' + input.value + ' vin ' + height);

                        const address = input.address;
                        // let value = Big(input.value);
                        // let value = input.value.toSatoshi();
                        const value = input.value.toString();

                        let addr = await addresses.findOne({ address: address });
                        // if address exists
                        if (addr) {
                            const found = addr.txs.some(transaction => {
                                return transaction.txid === tx.txid && transaction.type === 'vin';
                            });

                            if (!found) {
                                const add = {
                                    txs: { txid: tx.txid, type: 'vin', time: input.time, value: value },
                                }
                                // addr.sent = Big(addr.sent);
                                // addr.received = Big(addr.received);
                                // value = Big(value);

                                addr.sent = Decimal(addr.sent);
                                addr.received = Decimal(addr.received);

                                // console.log(value, typeof value);
                                // console.log(addr.received, typeof addr.received);
                                // console.log(addr.sent, typeof addr.sent);

                                // const sent = addr.sent + value;
                                // const balance = addr.received - sent;

                                const sent = addr.sent.plus(value);
                                const balance = addr.received.minus(sent);

                                const update = {
                                    sent: sent.toString(),
                                    balance: balance.toString()
                                    // sent: sent.toFixed(8),
                                    // balance: balance.toFixed(8)
                                }
                                const options = { upsert: true };

                                await addresses.updateOne({ address: address }, { $addToSet: add, $set: update }, options);
                            }
                            // if address doesn't exist
                        } else {
                            // console.log('VINS ELSE');
                            const insert = {
                                _id: address,
                                address: address,
                                txs: [{ txid: tx.txid, type: 'vin', time: input.time, value: value }],
                                // sent: value.toFixed(8),
                                // received: (0).toFixed(8),
                                // balance: value.toFixed(8)
                                sent: value,
                                received: (0).toString(),
                                balance: value
                            }

                            await addresses.insertOne(insert);
                        }
                    }
                }
                // }
                // VOUTS
                // const vouts = tx.vout;

                // for (const vout of vouts) {

                const recipients = await lib.getRecipients(tx);

                for (const recipient of recipients) {

                    // if (vout.scriptPubKey.addresses) {
                    //     const address = vout.scriptPubKey.addresses[0];
                    //     const value = vout.value;


                    //console.log(address + ' ' + value + ' vout ' + height);

                    const address = recipient.address;
                    // let value = Big(recipient.value);
                    // let value = recipient.value.toSatoshi();
                    const value = recipient.value.toString();

                    let addr = await addresses.findOne({ address: address });
                    // if address exists
                    if (addr) {
                        const found = addr.txs.some(transaction => {
                            return transaction.txid === tx.txid && transaction.type === 'vout';
                        });

                        if (!found) {
                            const add = {
                                txs: { txid: tx.txid, type: 'vout', time: tx.blocktime, value: value },
                            }
                            // addr.received = Big(addr.received);
                            // addr.sent = Big(addr.sent);
                            // value = Big(value);

                            // addr.received = parseFloat(addr.received);
                            // addr.sent = parseFloat(addr.sent);

                            // console.log(value, typeof value);
                            // console.log(addr.received, typeof addr.received);
                            // console.log(addr.sent, typeof addr.sent);

                            // const received = addr.received + value;
                            // let balance = received - addr.sent;

                            addr.received = Decimal(addr.received);
                            addr.sent = Decimal(addr.sent);

                            const received = addr.received.plus(value);
                            const balance = received.minus(addr.sent);

                            const update = {
                                received: received.toString(),
                                balance: balance.toString()
                                // received: received.toFixed(8),
                                // balance: balance.toFixed(8)
                            }
                            const options = { upsert: true };

                            await addresses.updateOne({ address: address }, { $addToSet: add, $set: update }, options);
                        }
                        // if address doesn't exist
                    } else {
                        const insert = {
                            _id: address,
                            address: address,
                            txs: [{ txid: tx.txid, type: 'vout', time: tx.blocktime, value: value }],
                            // received: value.toFixed(8),
                            // sent: (0).toFixed(8),
                            // balance: value.toFixed(8)
                            received: value,
                            sent: (0).toString(),
                            balance: value
                        }

                        await addresses.insertOne(insert);
                    }
                    // }
                }
                // }
            }
            if (height % 1000 === 0) {
                console.log(height);
            }
            // if (height == 5000) {
            //     console.timeEnd('test');
            //     process.exit();
            // }
            height++;
        }
        client.close();
        console.log('MongoDB closed');
    } catch (e) {
        console.log(e);
        process.exit();
    }
})();