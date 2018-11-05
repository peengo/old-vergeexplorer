'use strict';

const config = require('../config.js');
const mongo = require('mongodb').MongoClient;
const delay = require('delay');

const DELAY = 10 * 60 * 1000;

(async () => {
    while (true) {
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
            console.log('Sleeping...', DELAY, 'ms');
        } catch (e) {
            console.log(e);
            process.exit();
        } finally {
            await delay(DELAY);
        }
    }
})();