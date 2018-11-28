'use strict';

const config = require('../config.js');
const lib = require('../lib/lib.js');
const mongo = require('mongodb').MongoClient;
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
        const addr = db.collection(config.addr);
        const addr_txs = db.collection(config.addr_txs);

        // for (let height = 2500000; height <= 2700000; height++) {

        //     const block = await blocks.findOne({ height: height });
        //     const txids = block.tx;

        //     const transactions = await txs.find({ txid: { $in: txids } }).toArray();
        //     for (const tx of transactions) {
        //         await lib.prepareVins(tx, txs, addr, addr_txs, blocks);
        //         await lib.prepareVouts(tx, addr, addr_txs);
        //     }
        //     if (height % 1000 === 0) {
        //         console.log(height);
        //     }

        // }

        
        let height = 1940000;

        while (true) {
            const block = await blocks.findOne({ height: height });
            const txids = block.tx;

            const transactions = await txs.find({ txid: { $in: txids } }).toArray();
            for (const tx of transactions) {
                await lib.prepareVins(tx, txs, addr, addr_txs, blocks);
                await lib.prepareVouts(tx, addr, addr_txs);
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
    } catch (e) {
        console.log(e);
        process.exit();
    }
})();