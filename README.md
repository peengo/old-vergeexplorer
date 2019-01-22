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

<!--
End with an example of getting some data out of the system or using it for a little demo

## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc
-->
