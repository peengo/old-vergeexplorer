'use strict';

const config = require('../config.js');
const lib = require('../lib/lib.js');
const mongo = require('mongodb').MongoClient;
const delay = require('delay');
const BitcoinRpc = require('bitcoin-rpc-promise');

let rpc = new BitcoinRpc(config.rpcURL);

(async () => {
    while (true) {
        try {
            await rpc.getInfo();

            const client = await mongo.connect(config.mongoURL);
            console.log('MongoDB connected');
            const db = client.db(config.db);
            const blocks = db.collection(config.blocks);
            const transactions = db.collection(config.txs);
            const addr = db.collection(config.addr);
            const addr_txs = db.collection(config.addr_txs);

            // infinite loop
            while (true) {
                let count = await blocks.count();
                const blockDb = count;
                console.log('Blocks in', config.blocks, 'collection:', count);
                // go to last block if not zero
                if (count > 0) count--;

                const blockCount = await rpc.getBlockCount();

                console.log('Blocks in blockchain:', blockCount);
                console.log('Block difference:', (blockCount - blockDb));

                if (blockCount != blockDb) {
                    for (let i = count; i < blockCount; i++) {
                        let block = await rpc.call('getblockbynumber', i, true);
                        const txs = lib.prepareTxs(block);
                        block = lib.prepareBlock(block);

                        const options = { upsert: true };

                        if (i == count && i > 0) {
                            // UPDATE
                            const resBlock = await blocks.replaceOne({ _id: block.height }, block, options);
                            process.stdout.write('Block: ' + resBlock.ops[0].height + ' updated  ');
                            txs.forEach(async tx => {
                                const resTx = await transactions.replaceOne({ _id: tx.txid }, tx, options);

                                await lib.prepareVins(tx, transactions, addr, addr_txs, blocks);
                                await lib.prepareVouts(tx, addr, addr_txs);
                            });
                            console.log('|', txs.length, 'tx(s) updated');
                        } else {
                            // INSERT
                            const resBlock = await blocks.updateOne({ _id: block.height }, { $set: block }, options);
                            process.stdout.write('Block: ' + resBlock.upsertedId._id + ' inserted ');
                            const resTx = await transactions.insertMany(txs);
                            console.log('|', resTx.insertedCount, 'tx(s) inserted');

                            for (const tx of txs) {
                                await lib.prepareVins(tx, transactions, addr, addr_txs, blocks);
                                await lib.prepareVouts(tx, addr, addr_txs);
                            }
                        }
                    }
                }
                console.log('...Sleeping...Waiting for new blocks');
                await delay(10 * 1000);
            }
        } catch (e) {
            console.log(e);
        } finally {
            console.log('...Sleeping...Error');
            await delay(60 * 1000);
        }
    }
})();