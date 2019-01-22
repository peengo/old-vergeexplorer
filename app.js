const config = require('./config.js');

const compression = require('compression');
const helmet = require('helmet');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const i18n = require('i18n-express');
const fs = require("fs");
const { promisify } = require("util");
const uglify = require("uglify-es");
const mongo = require('mongodb').MongoClient;
const BitcoinRpc = require('bitcoin-rpc-promise');

let rpc = new BitcoinRpc(config.rpcURL);

const app = express();

app.locals.rpc = rpc;
app.locals.config = config;

// Localization
app.use(i18n({
    translationsPath: path.join(__dirname, 'locale'),
    browserEnable: false,
    siteLangs: ['en'],
    defaultLang: 'en',
    textsVarName: '$'
}));

// MongoDB Connection
(async () => {
    try {
        const client = await mongo.connect(config.mongoURL, { bufferMaxEntries: 0 });
        console.log('MongoDB connected');
        const db = client.db(config.db);

        app.locals.db = db;
        app.locals.blocks = db.collection(config.blocks);
        app.locals.txs = db.collection(config.txs);
        app.locals.addr = db.collection(config.addr);
        app.locals.addr_txs = db.collection(config.addr_txs);
        app.locals.richlist = db.collection(config.rich);
        app.locals.search = db.collection(config.search);
    } catch (e) {
        console.log(e);
    }
})();

// compression
app.use(compression())
// helmet
app.use(helmet());

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

// Minify
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

(async () => {
    try {
        console.log('Minifying script.js');
        const src = await readFile(path.join(__dirname, '/public/js/script.js'), 'utf8');
        const min = uglify.minify(src);
        
        if (min.error) {
            console.log(min.error);
        }
        
        await writeFile(path.join(__dirname, '/public/js/script.min.js'), min.code);
    } catch (e) {
        console.log(e);
    }
})();

app.use(async (req, res, next) => {
    const $ = req.app.locals.$;
    // set config vars for every view inside language integration
    $.USE_CDN = config.useCDN;
    $.BINANCE_LINK = config.binanceLink;
    $.DONATION_ADDRESS = config.donationAddress;
    $.DONATION_BTC = config.donationBTC;
    $.DONATION_LTC = config.donationLTC;
    // maintenance check
    if (config.maintenance) {
        res.status(500).send($.MAINTENANCE);
    } else {
        next();
    }
});

// ROUTES
app.use('/', require('./routes/index'));
app.use('/search', require('./routes/search'));
app.use('/block', require('./routes/block'));
app.use('/tx', require('./routes/tx'));
app.use('/address', require('./routes/address'));
app.use('/api', require('./routes/api'));
app.use('/richlist', require('./routes/richlist'));
app.use('/peers', require('./routes/peers'));
app.use('/donations', require('./routes/donations'));

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

module.exports = app;