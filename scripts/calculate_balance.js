'use strict';

const config = require('../config.js');
const lib = require('../lib/lib.js');
const mongo = require('mongodb').MongoClient;
const Decimal = require('decimal.js-light');
Decimal.set({
    precision: config.precision,
    toExpNeg: config.toExpNeg,
});

(async () => {
    try {
        //await cli.getinfo();
        const client = await mongo.connect(config.mongoURL);
        console.log('MongoDB connected');
        const db = client.db(config.db);
        const addr_txs = db.collection(config.addr_txs);

        let address = null;

        if (process.argv[2] !== undefined) {
            address = process.argv[2];
        } else {
            address = 'D9HsosoCM6pxWU4UD3cgHFacmD18Fu34g5';
        }

        let vins = await addr_txs.find({ address: address, type: 'vin' }).toArray();
        let vouts = await addr_txs.find({ address: address, type: 'vout' }).toArray();
        let boths = await addr_txs.find({ address: address, type: 'both' }).toArray();

        let vins_sum, vouts_sum, boths_sum;

        function reduceSum(obj) {
            let reduce = obj.reduce((a, b) => ({ value: Decimal(a.value).plus(Decimal(b.value)) }));
            return reduce.value;
        }

        (vins.length !== 0) ? vins_sum = Decimal(reduceSum(vins)) : vins_sum = Decimal(0);
        (vouts.length !== 0) ? vouts_sum = Decimal(reduceSum(vouts)) : vouts_sum = Decimal(0);
        (boths.length !== 0) ? boths_sum = Decimal(reduceSum(boths)) : boths_sum = Decimal(0);

        console.log('vins:', vins_sum.toString());
        console.log('vouts:', vouts_sum.toString());
        console.log('boths:', boths_sum.toString());
        console.log('balance:', vouts_sum.minus(vins_sum).plus(boths_sum).toString());

        client.close();
    } catch (e) {
        console.log(e);
        process.exit();
    }
})();