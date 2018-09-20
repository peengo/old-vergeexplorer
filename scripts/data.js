'use strict';

const config = require('../config.js');
const cli = require('../lib/cli.js');
const path = require('path');
const fs = require('fs');

const dataPath = path.join(__dirname, '../data');
const infoFile = path.join(dataPath, 'info.json');
const peersFile = path.join(dataPath, 'peers.json');

console.log(dataPath);

(async () => {
    const info = await cli.getinfo();
    const infoData = JSON.stringify(info, null, 2);

    const peers = await cli.getpeerinfo();
    const peersData = JSON.stringify(peers, null, 2);

    fs.writeFile(infoFile, infoData, (err) => {
        if (err) throw err;
        console.log('info written to file');
        fs.readFile(infoFile, (err, data) => {
            if (err) throw err;
            const info = JSON.parse(data);
            console.log(info.moneysupply);
        });
    });

    fs.writeFile(peersFile, peersData, (err) => {
        if (err) throw err;
        console.log('peers written to file');
        fs.readFile(peersFile, (err, data) => {
            if (err) throw err;
            const peers = JSON.parse(data);
            console.log(peers);
        });
    });
})();




