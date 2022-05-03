var http = require('http');
var request = require('request');

const express = require("express");
const bodyParser = require("body-parser");
const rpcMethods = require("./routes/api");

const app = express();

app.use(bodyParser.urlencoded({extended: false }));
app.use(bodyParser.json());

// Add headers before the routes are defined
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use("/api", rpcMethods);

const port = process.env.PORT || 4444

server = app.listen(port, "0.0.0.0", () => console.log(`Server running on port ${port}`));