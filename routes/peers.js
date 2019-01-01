const express = require('express');
const router = express.Router();

const config = require('./../config.js');

router.get('/', async (req, res, next) => {
    try {
        const localhost = '127.0.0.1';
        let arr = [];

        // OLD DB
        // const db = req.app.locals.peers;
        // let peers = await db.find().sort({ conntime: -1 }).toArray();

        // New RPC
        const rpc = req.app.locals.rpc;
        let peers = await rpc.getPeerInfo();

        peers = peers.splice(0, config.peerLimit - 1);

        peers.forEach(peer => {
            if (!peer.addr.includes(localhost)) {
                // remove port number
                peer.addr = peer.addr.split(':')[0];
                // remove '/'
                peer.subver = peer.subver.replace(/[/]/g, '');
                arr.push(peer);
            }
        });

        peers = arr;

        res.render('peers', { peers });
    } catch (e) {
        console.log(e)

        const $ = req.app.locals.$;
        const error = new Error($.ERROR);
        next(error);

        //res.status(500).send($.ERROR);
    }
});

// const path = require('path');
// const fs = require('fs');

// router.get('/', (req, res) => {
//     const dataPath = path.join(__dirname, '../data');
//     const peersFile = path.join(dataPath, 'peers.json');

//     const localhost = '127.0.0.1';
//     let arr = [];

//     fs.readFile(peersFile, (err, data) => {
//         if (err) throw err;

//         let peers = JSON.parse(data);

//         peers.forEach(peer => {
//             if (!peer.addr.includes(localhost)) {
//                 // remove port number
//                 peer.addr = peer.addr.split(':')[0];
//                 // remove '/'
//                 peer.subver = peer.subver.replace(/[/]/g, '');
//                 arr.push(peer);
//             }
//         });

//         peers = arr;

//         res.render('peers', { peers });
//     });
// });

module.exports = router;