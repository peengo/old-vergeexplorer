const auth = require('./auth.js');

module.exports = {
    // RPC
    rpcUser: auth.rpcUser,
    rpcPass: auth.rpcPass,
    rpcHost: 'localhost',
    rpcPort: '20102',
    get rpcURL() {
        return 'http://' + this.rpcUser + ':' + this.rpcPass + '@' + this.rpcHost + ':' + this.rpcPort;
    },

    // MONGODB
    mongoUser: auth.mongoUser,
    mongoPass: auth.mongoPass,
    mongoHost: 'localhost',
    mongoPort: '27017',
    get mongoURL() {
        return 'mongodb://' + this.mongoUser + ':' + this.mongoPass + '@' + this.mongoHost + ':' + this.mongoPort;
    },
    db: 'blockchain', // database name
    blocks: 'blocks', // blocks collection name
    txs: 'txs', // transactions collections name
    addr: 'addr', // addresses collection name
    addr_txs: 'addr_txs', // address transactions collection name
    info: 'info', // getinfo collection name
    peers: 'peers', // peers collection name
    rich: 'richlist', // richlist collection name
    search: 'search', // search collection name

    // configs
    latest: 10, // latest 10 blocks / txs on homepage
    limit: 50, // pager limit
    shortHash: 14, // short hash on first page followed by ...
    peerLimit: 30, // peer limit on peer page
    maintenance: false,
    usePrebuiltRichlist: true,
    hideNegativeBalanceAddress: true,

    // regexp
    hashRegExp: /^([A-Fa-f0-9]{64})$/,
    addressRegExp: /^([A-Za-z0-9]{34})$/,
    intRegExp: /^([0-9]{1,20})$/,

    // for decimal.js-light
    toExpNeg: -10, // The negative exponent value at and below which toString returns exponential notation.
    precision: 30, // The maximum number of significant digits of the result of an operation.

    // monetization
    donationAddress: 'DEHYYiNA4fb7h59DGPyrDNNoRRF5ZtMmy9',
    donationBTC: '18URw9ezbm7QSwsf8H6cxNxRFftBQmRCVM',
    donationLTC: 'LMpZDXuifWL21QynxmC7NtRpKkMSwmjUP6',
    binanceLink: 'https://www.binance.com/?ref=23129601'
}
