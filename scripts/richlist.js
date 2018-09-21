'use strict';

const config = require('../config.js');
//const lib = require('../lib/lib.js');
const mongo = require('mongodb').MongoClient;
const BitcoinRpc = require('bitcoin-rpc-promise');
const rpc = new BitcoinRpc('http://' + config.rpcUser + ':' + config.rpcPass + '@' + config.rpcHost + ':' + config.rpcPort);

(async () => {
    try {
        const client = await mongo.connect(config.mongoURL);
        console.log('MongoDB connected');
        const db = client.db(config.db);
        const addr = db.collection(config.addr);
        const rich = db.collection(config.rich);

        console.log('Building Richlist...');
        console.time('build');
        const addresses = await addr.find().sort({ balance: -1 }).collation({ locale: "en_US", numericOrdering: true }).limit(100).toArray();

        addresses.map((address, index) => {
            address.index = index + 1;
        });

        const richlist = {
            timestamp: Math.floor(Date.now() / 1000),
            data: addresses
        };
        console.log('Richlist built!');
        console.timeEnd('build');

        await rich.insertOne(richlist);
        console.log('Richlist inserted!');

        if (client) {
            client.close();
            console.log('MongoDB closed')
        }
    } catch (e) {
        console.log(e);
        process.exit();
    }
})();