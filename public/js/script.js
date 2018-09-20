'use strict'
// GLOBALS
const SHORTHASH = 14;
const SIZE = 1024;
const SPINTIME = 333;
const REFRESH = 60000;
const CONFIRMATIONS = 10000;
// CMC IDS
const BITCOIN = 1;
const VERGE = 693;

// ANIMATIONS
const fadeIn = el => {
    el.style.opacity = 0;
    let last = +new Date();
    const tick = function () {
        el.style.opacity = +el.style.opacity + (new Date() - last) / 400;
        last = +new Date();
        if (+el.style.opacity < 1) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 160);
        }
    };
    tick();
}
// FORMATINGS
const formatTimeAgo = timestamp => {
    const now = Date.now() / 1000;
    let seconds = Math.floor(now - timestamp);

    if (seconds < 0) return 'Negative number error';
    if (seconds == 0) return '< 1s';

    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);
    let months = Math.floor(days / 30);
    let years = Math.floor(months / 12);
    seconds = seconds % 60;
    minutes = minutes % 60;
    days = days % 24;
    months = months % 30;
    years = years % 12;

    let time = null;

    if (years) {
        time = years + ' y';
    } else if (months) {
        time = months + ' mon';
    } else if (days) {
        time = days + ' d';
    } else if (hours) {
        time = hours + ' h';
    } else if (minutes) {
        time = minutes + ' min';
    } else if (seconds) {
        time = '< 1 min';
    }

    return time;
}

const formatTimestamp = timestamp => {
    const date = new Date(timestamp * 1000);
    const locale = 'en-US'
    const format = date.getDate() + ' ' + date.toLocaleString(locale, { month: 'short' }) + ' ' + date.getFullYear() + ' - ' + date.toLocaleTimeString(locale);
    return format;
}

const toUSLocaleNoDecimals = val => {
    return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

const formatAmount = num => {
    num = num.toString();
    num = num.split('.');
    let int = num[0];
    let dec = num[1];
    // decimal
    if (dec === undefined) {
        dec = '00000000';
    } else {
        while (dec.length <= 8) {
            dec += '0';
        }
    }
    // integer
    let n = Math.floor(int.length / 3);
    let arr = [];
    let i = 0;
    while (i < n + 1) {
        arr.push(int.substring(int.length - 3 - (i * 3), int.length - (i * 3)));
        i++;
    }
    arr = arr.reverse();
    int = arr.join(',');
    let sign = '';
    if (int[0] === '-') {
        sign = '-';
        int = int.substring(1, int.length);
    }
    if (int[0] === ',') int = int.substring(1, int.length);
    num = sign + int + '.' + dec;

    return num;
}

const formatData = id => {
    // Format Time Ago
    const agos = document.querySelectorAll(id + ' .ago:not(.formated)');
    if (agos) {
        agos.forEach(ago => {
            ago.innerHTML = formatTimeAgo(ago.innerHTML);
            ago.classList.add('formated');
        });
    }
    // Format Timestamps
    const timestamps = document.querySelectorAll(id + ' .timestamp:not(.formated)');
    if (timestamps) {
        timestamps.forEach(timestamp => {
            timestamp.innerHTML = formatTimestamp(timestamp.innerHTML);
            timestamp.classList.add('formated');
        });
    }
    // Format Size
    const size = document.querySelector(id + ' .size:not(.formated)');
    if (size) {
        size.innerHTML = (size.innerHTML / SIZE).toFixed(2);
        size.classList.add('formated');
    }
    // Format Amount
    let amounts = document.querySelectorAll(id + ' .amount:not(.formated)');
    if (amounts) {
        amounts.forEach(amount => {
            amount.innerHTML = parseFloat(amount.innerHTML).toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
            // muted text before zeros and dot
            if (amount.dataset.stealth) {
                let str = amount.innerHTML;
                let i = 0;
                for (let j = str.length - 1; j >= 1; j--) {
                    if (str[j] === '0') { i++; } else { break; }
                }
                let num = str.substring(0, str.length - i);
                let rest = str.substring(str.length - i, str.length);
                // mute after the dot
                if (num.slice(-1) === '.') {
                    rest = num.slice(-1) + rest;
                    num = num.slice(0, -1);
                }
                str = num + '<span class="text-light">' + rest + '</span>';
                amount.innerHTML = str;
            }
            amount.classList.add('formated');
        });
    }
    // Format abbreviated Hashes
    const shorts = document.querySelectorAll(id + ' .short:not(.formated)');
    if (shorts) {
        shorts.forEach(short => {
            short.innerHTML = short.innerHTML.substr(0, SHORTHASH) + '...';
            short.classList.add('formated');
        });
    }
    // Format locale numbers (xxx,xxx,xxx);
    const locales = document.querySelectorAll(id + ' .locale:not(.formated)');
    if (locales) {
        locales.forEach(locale => {
            locale.innerHTML = toUSLocaleNoDecimals((parseFloat(locale.innerHTML)));
            locale.classList.add('formated');
        });
    }

    const amounts38 = document.querySelectorAll(id + ' .amount38:not(.formated)');
    if (amounts38) {
        amounts38.forEach(amount => {
            amount.innerHTML = formatAmount(amount.innerHTML);
            if (amount.dataset.stealth) {
                let str = amount.innerHTML;
                let i = 0;
                for (let j = str.length - 1; j >= 1; j--) {
                    if (str[j] === '0') { i++; } else { break; }
                }
                let num = str.substring(0, str.length - i);
                let rest = str.substring(str.length - i, str.length);
                // mute after the dot
                if (num.slice(-1) === '.') {
                    rest = num.slice(-1) + rest;
                    num = num.slice(0, -1);
                }

                /*
                str = num + '<span class="text-light">' + rest + '</span>';
                amount.innerHTML = str;
                */
                const span = document.createElement('span');
                span.classList.add('text-light');
                const restNode = document.createTextNode(rest);
                span.appendChild(restNode);
                while (amount.firstChild) amount.removeChild(amount.firstChild);
                amount.appendChild(span);
                amount.insertAdjacentText('afterbegin', num);
            }
            amount.classList.add('formated');
        });
    }
};

const getCMCData = async (id) => {
    const url = 'https://api.coinmarketcap.com/v2/ticker/';
    try {
        const res = await fetch(url + id + '/', { mode: 'cors' });
        const data = await res.json();
        return data;
    } catch (e) {
        console.log(e);
    }
}

const infoId = '#info';
const blockId = '#block';
const txsId = '#txs';
const txId = '#tx';
const addressId = '#address';
const richlistId = '#richlist';
const peersId = '#peers';

// formatData(txsId);
// formatData(txId);
// formatData(addressId);
// formatData(richlistId);
// formatData(peersId);

// Format data on other URIs
//formatData('#block');

const info = document.querySelector('#info');
const index = document.querySelector('#index');
const block = document.querySelector('#block');
const tx = document.querySelector('#tx');
const address = document.querySelector('#address');
const richlist = document.querySelector('#richlist');
const peers = document.querySelector('#peers');

if (info) {
    const getInfo = async () => {
        try {
            // get info
            const res = await fetch('/api/info');
            const data = await res.json();

            if (res.status === 500) {
                console.error(data.err);
                return;
            }

            // get CMC data
            const XVGdata = await getCMCData(VERGE);
            const BTCdata = await getCMCData(BITCOIN);

            // bind elements
            const synced = document.querySelector('#synced');
            const blocksCount = document.querySelector('#blocks_count');
            const moneySupply = document.querySelector('#moneysupply')
            const marketCapUSD = document.querySelector('#market_cap_usd');
            const marketCapBTC = document.querySelector('#market_cap_btc');
            const volume24h = document.querySelector('#volume_24h');
            const priceUSD = document.querySelector('#price_usd');
            const priceChange = document.querySelector('#price_change');
            const payTxFee = document.querySelector('#paytxfee');

            // set fields
            blocksCount.textContent = data.blocks;

            let sync = ((data.count / data.blocks) * 100);
            if (Number.isInteger(sync)) {
                sync = sync.toString()
            } else {
                sync = ((Math.floor(sync * 100) / 100)).toFixed(2);
            }
            /*
            if (Number.isInteger(sync)) {
                sync = sync.toString();
            } else {
                sync = sync.toString().split('.');
                const int = sync[0];
                let dec = sync[1].substr(0, 2);
                if (dec.length === 1) dec += '0';
                sync = int + '.' + dec;
            }
            */
            synced.innerHTML = sync + '<small> %</small>';

            moneySupply.textContent = data.moneysupply;

            const value = data.moneysupply * XVGdata.data.quotes.USD.price;
            marketCapUSD.textContent = toUSLocaleNoDecimals(value);

            const BTCvalue = value / BTCdata.data.quotes.USD.price;
            marketCapBTC.innerHTML = toUSLocaleNoDecimals(BTCvalue);

            volume24h.textContent = toUSLocaleNoDecimals(XVGdata.data.quotes.USD.volume_24h);

            priceUSD.textContent = XVGdata.data.quotes.USD.price;
            const percentage = XVGdata.data.quotes.USD.percent_change_24h;
            (percentage < 0) ? priceChange.classList.add('text-danger') : priceChange.classList.add('text-success');

            /*
            priceChange.innerHTML = percentage + '<small> %</small>';
            */
            const small = document.createElement('small');
            const textNode = document.createTextNode(' %');
            small.appendChild(textNode);
            while (priceChange.firstChild) priceChange.removeChild(priceChange.firstChild);
            priceChange.appendChild(small);
            priceChange.insertAdjacentText('afterbegin', percentage);
 
            payTxFee.textContent = data.paytxfee;

            formatData(infoId);
            fadeIn(info, 'block');
        } catch (e) {
            console.log(e);
        }
    }
    getInfo();

    setInterval(() => {
        getInfo();
    }, REFRESH);
}

// AJAX LATEST
if (index) {
    document.querySelector('#search').focus();
    const getData = col => {
        const loading = document.querySelector('#' + col + '_loading').classList;
        loading.remove('d-none');
        const refresh = document.querySelector('#' + col + '_refresh').classList;
        refresh.add('fa-spin');
        const tbody = document.querySelector('#' + col + ' > tbody');
        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
        fetch('/api/' + col + '/latest')
            .then(res => res.text())
            .then(data => {
                tbody.innerHTML = data;
                formatData('#' + col);
                fadeIn(tbody, 'table-row-group');
                loading.add('d-none');

                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        refresh.remove('fa-spin');
                        resolve();
                    }, SPINTIME)
                });
            })
            .catch(e => {
                console.log(e);
            });
    }
    // Init
    getData('blocks');
    getData('txs');

    // Interval Refresh
    setInterval(() => {
        getData('blocks');
        getData('txs');
    }, REFRESH);

    document.querySelector('#btn_blocks').addEventListener('click', () => { getData('blocks') });
    document.querySelector('#btn_txs').addEventListener('click', () => { getData('txs') });
}

// BLOCK & TX CODE
if (block || tx) {
    const styleConfirmations = () => {
        const confirmations = document.querySelector('.confirmations > span').textContent;
        const confirmationsField = document.querySelector('.confirmations').classList;
        if (confirmations >= 20) {
            confirmationsField.remove('text-muted');
            confirmationsField.add('text-success');
        } else {
            confirmationsField.remove('text-success');
            confirmationsField.add('text-muted');
        }
    }
    styleConfirmations();

    const getConfirmations = hash => {
        const refresh = document.querySelector('.confirmations_refresh').classList;
        refresh.remove('text-muted');
        refresh.add('text-white');
        refresh.add('fa-spin');
        fetch('/api/confirmations/' + hash)
            .then(res => res.json())
            .then(data => {
                const confirmations = document.querySelector('.confirmations span');
                confirmations.textContent = data.confirmations;

                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        refresh.remove('fa-spin');
                        refresh.remove('text-white');
                        refresh.add('text-muted');
                        styleConfirmations();
                        resolve();
                    }, 1000)
                });
            })
            .catch(e => {
                console.log(e);
            });
    }

    setInterval(() => {
        const blockHash = document.querySelector('#block_hash').textContent;
        getConfirmations(blockHash);
    }, CONFIRMATIONS);
}

// BLOCK
if (block) {
    formatData(blockId);
    // Toggle Button Icon
    const collapseList = document.querySelector('#collapseList');
    const faIcon = document.querySelector('#block_more_btn > i').classList;
    collapseList.addEventListener('show.bs.collapse', () => {
        faIcon.remove('fa-angle-down');
        faIcon.add('fa-angle-up');
    }, false);
    collapseList.addEventListener('hide.bs.collapse', () => {
        faIcon.remove('fa-angle-up');
        faIcon.add('fa-angle-down');
    }, false);
    // AJAX - GET BLOCK TRANSACTIONS
    const getBlockTxs = () => {
        // if (event) event.preventDefault();
        if (document.querySelector('#block_txs')) {
            const loading = document.querySelector('#block_txs_loading').classList;
            loading.remove('d-none');
            const blockTxsBtn = document.querySelector('#block_txs_btn').classList;
            blockTxsBtn.add('d-none');
            let blockTxs = document.querySelector('#block_txs > tbody');
            const blockHash = document.querySelector('#block_hash').textContent;
            let rows = blockTxs.rows.length;
            fetch('/api/block/txs/' + blockHash + '/' + rows)
                .then(res => res.text())
                .then(data => {
                    blockTxs.insertAdjacentHTML('beforeend', data);
                    loading.add('d-none');
                    const lastTr = document.querySelector('#block_txs > tbody > tr:last-child');
                    if (!lastTr.dataset.all) blockTxsBtn.remove('d-none');
                    formatData(txsId);

                    const shownTxs = document.querySelector('#block_txs > tbody');
                    const shownRows = shownTxs.rows.length;
                    const shown = document.querySelector('#txs_counter > span');
                    shown.innerHTML = shownRows;
                })
                .catch(e => {
                    console.log(e);
                });
        }
    }
    getBlockTxs();
    if (document.querySelector('#block_txs_btn')) document.querySelector('#block_txs_btn').addEventListener('click', getBlockTxs);
}

// TRANSACTION
if (tx) {
    formatData(txId);
    // AJAX - GET INPUT ADDRESSES
    const getInputs = () => {
        // if (event) event.preventDefault();
        if (document.querySelector('#tx_inputs')) {
            const loading = document.querySelector('#tx_inputs_loading').classList;
            loading.remove('d-none');
            const txInputsBtn = document.querySelector('#tx_inputs_btn').classList;
            txInputsBtn.add('d-none');
            let txInputs = document.querySelector('#tx_inputs');
            const txid = document.querySelector('#txid').textContent;
            let rows = txInputs.childElementCount;
            fetch('/api/tx/inputs/' + txid + '/' + rows)
                .then(res => res.text())
                .then(data => {
                    txInputs.insertAdjacentHTML('beforeend', data);
                    loading.add('d-none');
                    const lastLi = document.querySelector('#tx_inputs > li:last-child');
                    if (!lastLi.dataset.all) txInputsBtn.remove('d-none');

                    const shownInputs = document.querySelector('#tx_inputs');
                    const shownRows = shownInputs.childElementCount;
                    const shown = document.querySelector('#inputs_counter');
                    const count = lastLi.dataset.count;
                    shown.innerHTML = shownRows + '/' + count;
                })
                .catch(e => {
                    console.log(e);
                });
        }
    }
    getInputs();
    if (document.querySelector('#tx_inputs_btn')) document.querySelector('#tx_inputs_btn').addEventListener('click', getInputs);

    // AJAX - GET RECIPIENTS
    const getRecipients = event => {
        // if (event) event.preventDefault();
        if (document.querySelector('#tx_recipients')) {
            const loading = document.querySelector('#tx_recipients_loading').classList;
            loading.remove('d-none');
            const txRecipientsBtn = document.querySelector('#tx_recipients_btn').classList;
            txRecipientsBtn.add('d-none');
            let txRecipients = document.querySelector('#tx_recipients');
            const txid = document.querySelector('#txid').textContent;
            let rows = txRecipients.childElementCount;
            fetch('/api/tx/recipients/' + txid + '/' + rows)
                .then(res => res.text())
                .then(data => {
                    txRecipients.insertAdjacentHTML('beforeend', data);
                    loading.add('d-none');
                    const lastLi = document.querySelector('#tx_recipients > li:last-child');
                    if (!lastLi.dataset.all) txRecipientsBtn.remove('d-none');

                    const shownRecipients = document.querySelector('#tx_recipients');
                    const shownRows = shownRecipients.childElementCount;
                    const shown = document.querySelector('#recipients_counter');
                    const count = lastLi.dataset.count;
                    shown.innerHTML = shownRows + '/' + count;
                })
                .catch(e => {
                    console.log(e);
                });
        }
    }
    getRecipients();
    if (document.querySelector('#tx_recipients_btn')) document.querySelector('#tx_recipients_btn').addEventListener('click', getRecipients);
}

// ADDRESS
if (address) {
    formatData(addressId)
    // AJAX - GET ADDRESS TRANSACTIONS
    const getAddressTxs = (event, refresh) => {
        // if (event) event.preventDefault();
        if (document.querySelector('#address_txs')) {
            const loading = document.querySelector('#address_txs_loading').classList;
            loading.remove('d-none');
            const addressTxsBtn = document.querySelector('#address_txs_more_btn').classList;
            addressTxsBtn.add('d-none');
            let addressTxs = document.querySelector('#address_txs > tbody');
            const address = document.querySelector('#address_hash').textContent;

            let rows = 0;
            if (refresh !== true) rows = addressTxs.rows.length;

            fetch('/api/address/txs/' + address + '/' + rows)
                .then(res => res.text())
                .then(data => {
                    addressTxs.insertAdjacentHTML('beforeend', data);
                    loading.add('d-none');
                    const lastTr = document.querySelector('#address_txs > tbody > tr:last-child');
                    if (!lastTr.dataset.all) addressTxsBtn.remove('d-none');
                    formatData(txsId);

                    const shownTxs = document.querySelector('#address_txs > tbody');
                    const shownRows = shownTxs.rows.length;
                    const shown = document.querySelector('#txs_counter > span');
                    shown.innerHTML = shownRows;
                })
                .catch(e => {
                    console.log(e);
                });
        }
    }
    getAddressTxs();
    // Show More
    document.querySelector('#address_txs_more_btn').addEventListener('click', getAddressTxs);
    // Refresh
    document.querySelector('#address_txs_refresh_btn').addEventListener('click', event => {
        const refresh = document.querySelector('#address_txs_refresh_btn > i').classList;
        refresh.add('fa-spin');

        new Promise((resolve, reject) => {
            setTimeout(() => {
                refresh.remove('fa-spin');
                resolve();
            }, SPINTIME)
        });

        const tbody = document.querySelector('#address_txs > tbody');
        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
        getAddressTxs(event, true);
    });
}

// For richlist and address
const setValues = async () => {
    try {
        const values = document.querySelectorAll('.value')
        const XVGData = await getCMCData(VERGE);
        const price = XVGData.data.quotes.USD.price;
        if (values) {
            values.forEach(async value => {
                const unformated = value.dataset.value * price;
                value.dataset.unformated = unformated;
                value.textContent = unformated.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            });
        }
    } catch (e) {
        console.log(e);
    }
}

// RICHLIST
if (richlist) {
    let tbody = document.querySelector('#richlist > tbody');
    const loading = document.querySelector('#richlist_loading').classList;
    fetch('/api/richlist')
        .then(res => res.text())
        .then(data => {
            tbody.innerHTML = data;
            loading.add('d-none');
            fadeIn(tbody, 'table-row-group');
            setValues();
            const supply = richlist.dataset.supply;
            const percentages = document.querySelectorAll('.percentage')
            if (percentages) {
                percentages.forEach(percentage => {
                    const value = percentage.dataset.value;
                    percentage.textContent = ((value / supply) * 100).toFixed(2);
                });
            }
            formatData(richlistId);
        })
        .catch(e => {
            console.log(e);
        });
}

// ADDRESS
if (address) {
    setValues();
}

// PEERS
if (peers) {
    formatData(peersId);
}

// SEARCH AJAX
const postSearch = event => {
    event.preventDefault();
    const search = document.querySelector('#search');
    const error = document.querySelector('#error');
    fetch('/search',
        {
            method: 'POST',
            body: JSON.stringify({ search: search.value }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .catch(e => console.log(e))
        .then(response => {
            if (response.error) {
                error.textContent = response.error
            } else if (response.redirect) {
                window.location.href = response.redirect;
            }
        });
}
document.querySelector('#search_form').addEventListener('submit', postSearch);

// SEARCH Private Key Check
const checkForPrivKey = () => {
    const search = document.querySelector('#search');
    if (search.value.length == 51) {
        const text = W;
        if (confirm(text)) {
            search.value = null;
        }
    }
}
document.querySelector('#search').addEventListener('input', checkForPrivKey);
