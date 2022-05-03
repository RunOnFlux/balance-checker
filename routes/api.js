const express = require("express");
const router = express.Router();
var request = require("request");

const dotenv = require("dotenv");
dotenv.config();

const hooks = require("../discord/hooks.js");
const { nextPowerTwo } = require("add");
const res = require("express/lib/response");

const axios = require('axios').default;

const USER = process.env.RPC_USER;
const PASS = process.env.RPC_PASSWORD;
const RPC_PORT = process.env.RPC_PORT;

const explorers = 
    { "FLUX": 'https://explorer.runonflux.io/address/',
      "TRON": 'https://tronscan.org/#/address/',
      "ETH":  'https://etherscan.io/address/',
      "BSC":  'https://bscscan.com/address/',
      "SOL":  'https://solscan.io/account/'
    }

const addresses = [
    { "coin": "FLUX", "label": "SNAPSHOT", "address": 't1UwmAPJ1kv1qy6hV93nL5d5pQezBL55TgN', "ALERT": 0},
    { "coin": "FLUX", "label": "MINING", "address": 't1Yum7okNzR5kW84dfgwqB23yy1BCcpHFPq', "ALERT": 0},
    { "coin": "FLUX", "label": "SWAP", "address": 't1abAp9oZenibGLFuZKyUjmL6FiATTaCYaj', "ALERT": 1},
    { "coin": "FLUX", "label": "COLD", "address": 't1cjcLaDHkNcuXh6uoyNL7u1jx7GxvzfYAN', "ALERT": 0},

    { "coin": "SOL", "label": "SNAPSHOT", "address": '94W7UnJTBNEQSAk854NLTBgbqzSqHQNyFtQYPiGzNFaA', "ALERT": 0.001},
    { "coin": "SOL", "label": "MINING", "address": '9dfk2Rq1MnuvjQvTsBkWvncpvQsuR8vrioFzkFG7HKvW', "ALERT": 0.001},
    { "coin": "SOL", "label": "SWAP", "address": 'CCafnH2sUhPHitQWyFLDCe3Xqwz1Vrc2caNR6PAwkPzP', "ALERT": 0.001},
    { "coin": "SOL", "label": "COLD", "address": '98duys57BNeYNdA4JPYzkraXe1XoUYXq5MMesx1JLsFY', "ALERT": 0.001},

    { "coin": "BSC", "label": "SNAPSHOT", "address": '0x4004755e538b77f80004b0f9b7f7df4e9793e584', "ALERT": 0.01},
    { "coin": "BSC", "label": "MINING", "address": '0x8cb191750096ddc8f314c2de6ef28331503774e9', "ALERT": 0.01},
    { "coin": "BSC", "label": "SWAP", "address": '0x9b192227da99b5a50d037b10c965609ed83c43d7', "ALERT": 0.01},
    { "coin": "BSC", "label": "COLD", "address": '0x5b79692e093c70e47070f525b593cc35b5adf530', "ALERT": 0},

    { "coin": "ETH", "label": "SNAPSHOT", "address": '0x5a2387883bc5e875e09d533eef812b2da30f2615', "ALERT": 0.1},
    { "coin": "ETH", "label": "MINING", "address": '0x342c34702929849b6deaa47496d211cbe4167fa5', "ALERT": 0.1},
    { "coin": "ETH", "label": "SWAP", "address": '0x134e4c74c670adefdcb2476df6960d9297bc7dad', "ALERT": 0.1},
    { "coin": "ETH", "label": "COLD", "address": '0xa23702e9349fbf9939864da1245f5b358e7ef30b', "ALERT": 0},

    { "coin": "TRON", "label": "SNAPSHOT", "address": 'TSHXNnsrKGf6KAfosq5mckCnaY7gUfGwBJ', "ALERT": 100},
    { "coin": "TRON", "label": "MINING", "address": 'TVkT9g2zzgcztm81RozqBA1UbwzZpoN8cM', "ALERT": 100},
    { "coin": "TRON", "label": "SWAP", "address": 'TA7U2PTnHDyhHBns3X6NsDndjZDBUE3oUa', "ALERT": 100},
    { "coin": "TRON", "label": "COLD", "address": 'THV8NGvAwyaL22kkhkXHVhL7JBDyxRs3BZ', "ALERT": 0},

]

let balances = [];

const headers = {
  "content-type": "text/plain;"
};

router.get("/test", (req, res) => res.json({ msg: "backend works asfds asdfasdfafsd" }));

router.get("/data", (req, res) => res.json({ data: fluxBalances }));

module.exports = router;

function fetchBalances() {

    balances = []
    addresses.forEach(function(item) {

        api_url = buildApiCall(item.coin, item.address);
        if(!api_url){
            return;
        }

        if (item.coin === 'SOL') {
            /// For some reason, request wasn't working with the SOL CHAIN
            axios.get(api_url, {}).then(function(value) {
                if(value.status == 200) {
                    parseResponse(item, value.data);
                } else {
                    console.log('error' + value);
                }
            });
        } else {
            request({
                url: `${api_url}`,
                method: "GET",
                timeout: 10000,
                followRedirect: true,
                maxRedirects: 10
            },function(error, response, body) {
                if(!error && response.statusCode == 200){
                    const json = JSON.parse(response.body)
                    parseResponse(item, json);
                } else {
                    console.log('error' + error);
                }
            });
        }
    });
}

function checkHooks() {
    balances.forEach(function(item) {
        hooks.checkHook(item, explorers[item.coin]);
    });
}

function buildApiCall(coin, address) {
    if (coin === 'FLUX') {
        return `https://explorer.runonflux.io/api/addr/${address}`;
    } else if (coin === 'SOL') {
        return `https://public-api.solscan.io/account/${address}`;
    } else if (coin === 'BSC') {
        return `https://api.bscscan.com/api?module=account&action=balance&address=${address}&apikey=${process.env.BSC_API_KEY}`;
    } else if (coin === 'ETH') {
        return `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.ETH_API_KEY}`;
    } else if (coin === 'TRON') {
        return `https://apilist.tronscan.org/api/account?address=${address}`;
    }
    
    return undefined;
}

function parseResponse(item, response) {
    if (item.coin === 'FLUX') {
        item.balance = response.balance;
        balances.push(item);
    } else if (item.coin === 'SOL') {
        item.balance = Number(response.lamports) * 10e-10;
        balances.push(item);
    } else if (item.coin === 'BSC') {
        item.balance = Number(response.result) * 10e-19;
        balances.push(item);
    } else if (item.coin === 'ETH') {
        item.balance = Number(response.result) * 10e-19;
        balances.push(item);
    } else if (item.coin === 'TRON') {
        item.balance = Number(response.balance) * 10e-7;
        balances.push(item);
    }
}

var requestLoop = setInterval(function(){
    fetchBalances();
  }, 1000*60*30);

// var printLoop = setInterval(function(){
//     console.log(balances);
// }, 5000);

var hookLoop = setInterval(function(){
    checkHooks();
}, 1000*60*60);

fetchBalances();

