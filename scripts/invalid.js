'use strict';

const config = require('../config.js');
//const lib = require('../lib/lib.js');
const mongo = require('mongodb').MongoClient;
const BitcoinRpc = require('bitcoin-rpc-promise');
const rpc = new BitcoinRpc(config.rpcURL);

(async () => {
    try {
        const client = await mongo.connect(config.mongoURL;
        console.log('MongoDB connected');
        const db = client.db(config.db);
        const blocks = db.collection(config.blocks);

        let count = await blocks.count();
        console.log(count);

        for (let i = 1720000; i >= 0; i--) {
            const blockRPC = await rpc.call('getblockbynumber', i, true);
            const blockDB = await blocks.findOne({ height: i });
            if (blockRPC.hash !== blockDB.hash) {
                console.log('--------------------------------------------------');
                console.log('HEIGHT:', i);
                console.log('RPC:', blockRPC.hash);
                console.log('DB:', blockDB.hash);
                console.log('--------------------------------------------------');
            }

            if (i % 10000 === 0) {
                console.log(i);
            }
        }
    } catch (e) {
        console.log(e);
        process.exit();
    }
})();