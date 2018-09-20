'use strict';

const config = require('../config.js');
const lib = require('../lib/lib.js');
const cli = require('../lib/cli.js');
const verge = require('node-verge')();
const util = require('util');

const BitcoinRpc = require('bitcoin-rpc-promise');
 
let btc = new BitcoinRpc('http://vergerpcusername:85CpSuCNvDcYsdQU8w621mkQqJAimSQwCSJL5dPT9wQX@localhost:20102');

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
        // const txs = db.collection(config.txs);
        // const addr = db.collection('addr');
        // const addr_txs = db.collection('addr_txs');

        verge.auth('vergerpcusername', '85CpSuCNvDcYsdQU8w621mkQqJAimSQwCSJL5dPT9wQX');

		let countDB = await blocks.count();
		
		let height = countDB - 1;

        while (true) {
            
            const blockDB = await blocks.findOne({ height: height });
            //confirmationsDB = lib.getCalculatedConfirmations(countDB, blockDB.height);

            //const blockCLI = await cli.getblockbynumber(height);
            
			// confiramtionsCLI = blockCLI.confirmations;
	
	
			/*
            if (blockDB.hash !== blockCLI.hash) {
                console.log('Height:', height);
                console.log('Block in DB:', blockDB.hash);
                console.log('Block in CLI:', blockCLI.hash);
				process.exit();
            }
			*/


            // if (height % 1000 === 0) {
            //     console.log(height);
            // }

            //console.log('height:', height);
			
			/*
			const hash = await btc.call('getblockbynumber', height);
			console.log(hash);
			*/
			
			/*
			btc.call('getblockbynumber', height).then(result => {
				console.log(result.hash);
			});
			*/
			
			
            verge.exec('getblock', blockDB.hash, (err, blockRPC) => {
				if (err) throw err;
				
				console.log('hash:', blockRPC.hash);
				//console.log(blockRPC.hash);
				
				if (blockDB.hash !== blockRPC.hash) {
					console.log('Height:', height);
					console.log('Block in DB:', blockDB.hash);
					console.log('Block in RPC:', blockRPC.hash, blockRPC.confirmations);
					process.exit();
				}
				
			})
			
			
			//process.exit();

            height--;
        }
        // client.close();
        // console.log('MongoDB closed');
    } catch (e) {
        console.log(e);
        process.exit();
    }
})();