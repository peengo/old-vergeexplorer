const config = require('../config.js');
const { execFile } = require('child_process');

const cli = {
    file: config.file,
    commands: [
        'getinfo',
        'getblockcount',
        'getblock',
        'getblockhash',
        'getblockbynumber',
        'gettransaction',
        'getpeerinfo'
    ]
};

cli.commands.forEach(cmd => {
    cli[cmd] = (...args) => {
        args.unshift(cmd);
        return new Promise((resolve, reject) => {
            execFile(cli.file, args, { maxBuffer: config.maxBuffer }, (error, stdout, stderr) => {
                if (error) {
                    reject(/*error + ' ' + */stderr.toString().trim());
                } else {
                    resolve(JSON.parse(stdout));
                }
            });
        });
    }
});

module.exports = cli;