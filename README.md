# VergeExplorer

A responsive design Verge (XVG) Cryptocurrency Blockchain Explorer built on top of NodeJS

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them

```
NodeJS v8.15.0
MongoDB v4.0.5
VERGEd v4.0.2.0-92ed1c0-funky-beta (https://github.com/vergecurrency/VERGE/)
```

### Installing

A step by step series of examples that tell you how to get a development env running

Clone the repository

```
git clone https://github.com/peengo/vergeexplorer.git
```

Install npm packages and dependencies

```
cd vergeexplorer && npm install
```

In root directory create auth.js file with the next code. Replace empty strings with the proper data

```
module.exports = {
    // RPC
    rpcUser: '',
    rpcPass: '',
    // MONGODB
    mongoUser: '',
    mongoPass: ''
}
```

Start sync and build richlist scripts

```
node scripts/sync.js
node scripts/build_richlist.js
```

Start the web server

```
DEBUG=vergeexplorer:* & npm run devstart
```

...
TODO
...