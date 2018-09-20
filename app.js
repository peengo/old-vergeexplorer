const compression = require('compression');

const createError = require('http-errors');
const express = require('express');
const path = require('path');
//const cookieParser = require('cookie-parser');
const logger = require('morgan');

const i18n = require('i18n-express');

// APP
const config = require('./config.js');
const cli = require('./lib/cli.js');

// RPC
const BitcoinRpc = require('bitcoin-rpc-promise');
let rpc = new BitcoinRpc('http://vergerpcusername:85CpSuCNvDcYsdQU8w621mkQqJAimSQwCSJL5dPT9wQX@localhost:20102');

const app = express();

app.locals.rpc = rpc;
// Localization
app.use(i18n({
    translationsPath: path.join(__dirname, 'locale'),
    browserEnable: false,
    siteLangs: ['en'],
    defaultLang: 'en',
    textsVarName: '$'
}));

let daemonErr = false;
let mongoErr = false;

// Daemon Test
const daemonConnect = async () => {
    try {
        await rpc.getInfo();
    } catch (e) {
        daemonErr = false;
        console.log(e);
    }
}

// MongoDB Connection
const mongo = require('mongodb').MongoClient;
const mongoConnect = async () => {
    try {
        const client = await mongo.connect(config.mongoURL, { bufferMaxEntries: 0 });
        console.log('MongoDB connected');
        const db = client.db(config.db);

        app.locals.db = db;
        app.locals.blocks = db.collection(config.blocks);
        app.locals.txs = db.collection(config.txs);
        app.locals.addr = db.collection(config.addr);
        app.locals.info = db.collection(config.info);
        app.locals.peers = db.collection(config.peers);
    } catch (e) {
        mongoErr = false;
        console.log(e);
    }
};



// compression
app.use(compression())

// support for partials
const hbs = require('hbs');
hbs.registerPartials(path.join(__dirname, '/views/partials'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ROUTES

(async () => {
    await daemonConnect();
    await mongoConnect();

    if (config.maintenance) {
        app.get('*', (req, res) => { res.send('Maintenance. Please check back later.') })
    }
    else if (daemonErr) {
        app.get('*', (req, res) => { res.send('Daemon error.') })
    } else if (mongoErr) {
        app.get('*', (req, res) => { res.send('Database error.') })
    }
    else {
        app.use('/', require('./routes/index'));
        app.use('/search', require('./routes/search'));
        app.use('/block', require('./routes/block'));
        app.use('/tx', require('./routes/tx'));
        app.use('/address', require('./routes/address'));
        app.use('/api', require('./routes/api'));
        app.use('/richlist', require('./routes/richlist'));
        app.use('/peers', require('./routes/peers'));

        // catch 404 and forward to error handler
        app.use((req, res, next) => {
            next(createError(404));
        });

        // error handler
        app.use((err, req, res, next) => {
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};

            // render the error page
            res.status(err.status || 500);
            res.render('error');
        });

        app.disable('x-powered-by');
    }
})();

module.exports = app;