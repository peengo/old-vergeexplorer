'use strict';

const config = require('../config.js');
const lib = require('../lib/lib.js');
const cli = require('../lib/cli.js');
const mongo = require('mongodb').MongoClient;
/*
const Decimal = require('decimal.js-light');
Decimal.set({
    precision: config.precision,
    toExpNeg: config.toExpNeg,
});
*/
const BitcoinRpc = require('bitcoin-rpc-promise');
let rpc = new BitcoinRpc('http://' + config.rpcUser + ':' + config.rpcPass + '@' + config.rpcHost + ':' + config.rpcPort);

const sleep = (ms = 0) => {
    return new Promise(r => setTimeout(r, ms));
}

console.time('test');

(async () => {
    try {
        //await cli.getinfo();
        await rpc.getInfo();

        const client = await mongo.connect(config.mongoURL);
        console.log('MongoDB connected');
        const db = client.db(config.db);
        const blocks = db.collection(config.blocks);
        const transactions = db.collection(config.txs);
        const info = db.collection(config.info);
        const peers = db.collection(config.peers);

        const addr = db.collection(config.addr);
        const addr_txs = db.collection(config.addr_txs);

        // infinite loop
        while (true) {
            let count = await blocks.count();
            const blockDb = count;
            console.log('Blocks in ' + config.blocks + ' collection: ' + count);
            // go to last block if not zero
            if (count > 0) count--;

            // const blockCount = await cli.getblockcount();
            const blockCount = await rpc.getBlockCount();

            console.log('Blocks in blockchain: ' + blockCount);
            console.log('Block difference: ' + (blockCount - blockDb));

            //count = 2000000;

            if (blockCount != blockDb) {
                for (let i = count; i < blockCount; i++) {
                    // GETINFO
                    /*
                    cli.getinfo().then(getInfo => {
                        getInfo._id = 1;
                        return info.replaceOne({ _id: 1 }, getInfo, { upsert: true });
                    }).then(resInfo => {
                        console.log(' Supply: ' + resInfo.ops[0].moneysupply);
                    }).catch(e => {
                        console.log(e);
                    });
                    */

                    /*
                    const getInfo = await cli.getinfo();
                    getInfo._id = 1;
                    const resInfo = await info.replaceOne({ _id: 1 }, getInfo, { upsert: true });
                    console.log(' Supply: ' + resInfo.ops[0].moneysupply);
                    */

                    // PEERS
                    /*
                    cli.getpeerinfo().then(connections => {
                        peers.deleteMany({});
                        return connections;
                    }).then(connections => {
                        peers.insertMany(connections);
                    }).catch(e => {
                        console.log(e);
                    });
                    */

                    /*
                    const connections = await cli.getpeerinfo();
                    await peers.deleteMany({});
                    await peers.insertMany(connections);
                    */


                    // BLOCK
                    //const block = await cli.getblockbynumber(i, true);
                    const block = await rpc.call('getblockbynumber', i, true);

                    const txs = block.tx;
                    txs.map(tx => {
                        tx._id = tx.txid;
                        tx.blockhash = block.hash;
                        tx.confirmations = block.confirmations;
                        tx.blocktime = block.time;
                        tx.height = block.height;
                    });

                    block.tx = block.tx.map((tx) => tx.txid);
                    block._id = block.height;

                    const options = { upsert: true };

                    if (i == count && i > 0) {
                        // UPDATE
                        const resBlock = await blocks.replaceOne({ _id: block.height }, block, options);
                        process.stdout.write('Block: ' + resBlock.ops[0].height + ' updated  ');
                        txs.forEach(async tx => {
                            const resTx = await transactions.replaceOne({ _id: tx.txid }, tx, options);
                            //console.log('txid: ' + resTx.ops[0].txid + ' updated');

                            await lib.prepareVins(tx, transactions, addr, addr_txs);
                            await lib.prepareVouts(tx, addr, addr_txs);
                        });
                        console.log('| ' + txs.length + ' tx(s) updated');
                    } else {
                        // INSERT
                        const resBlock = await blocks.insertOne(block);
                        process.stdout.write('Block: ' + resBlock.insertedId + ' inserted ');
                        const resTx = await transactions.insertMany(txs);
                        console.log('| ' + resTx.insertedCount + ' tx(s) inserted');

                        for (const tx of txs) {
                            await lib.prepareVins(tx, transactions, addr, addr_txs);
                            await lib.prepareVouts(tx, addr, addr_txs);
                        }
                    }

                    // if (i == 2001000) {
                    //     console.timeEnd('test');
                    //     process.exit();
                    // }
                }
            }
            console.log('...Sleeping...');
            await sleep(config.sleep);
        }
        client.close();
        console.log('MongoDB closed');
    } catch (e) {
        console.log(e);
        process.exit();
        // client.close();
        // console.log('MongoDB closed');
    }
})();