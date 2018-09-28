module.exports = {
    file: 'D:\\Crypto\\NewVergeWallet\\VERGEd.exe', // daemon
    maxBuffer: 10 * 1024 * 1024, // buffer size for execFile

    sleep: 10 * 1000, // 10 seconds
    sleepErr: 60 * 1000, // 60 seconds

    rpcUser: 'vergerpcusername',
    rpcPass: '85CpSuCNvDcYsdQU8w621mkQqJAimSQwCSJL5dPT9wQX',
    rpcHost: 'localhost',
    rpcPort: '20102',
    rpcUrl() {
        return 'http://' + this.rpcUser + ':' + this.rpcPass + '@' + this.rpcHost + ':' + this.rpcPort;
    },

    mongoURL: 'mongodb://localhost:27017',
    db: 'blockchain', // database name
    blocks: 'blocks', // blocks collection name
    txs: 'txs', // transactions collections name
    addr: 'addr', // addresses collection name
    addr_txs: 'addr_txs', // address transactions collection name
    info: 'info', // getinfo collection name
    peers: 'peers', // peers collection name
    rich: 'richlist', // richlist collection name

    latest: 10, // latest 10 blocks / txs on homepage
    limit: 50, // pager limit
    shortHash: 14, // short hash on first page followed by ...

    hashRegExp: /^([A-Fa-f0-9]{64})$/,
    addressRegExp: /^([A-Za-z0-9]{34})$/,
    intRegExp: /^([0-9]{1,20})$/,

    // for decimal.js-light
    toExpNeg: -10, // The negative exponent value at and below which toString returns exponential notation.
    precision: 30, // The maximum number of significant digits of the result of an operation.

    maintenance: false,
    usePrebuiltRichlist: true
}
