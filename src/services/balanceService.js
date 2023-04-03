const config = require('config');
const axios = require('axios');
const dotenv = require('dotenv');

const log = require('../lib/log');
const hooks = require('../../discord/hooks');

dotenv.config();
const { explorers, addresses, fetchDelay } = config;

const balances = {};
const history = {};

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function search(nameKey, object) {
  return object.find((o) => o.tokenAddress === nameKey || o.tokenId === nameKey || o.address === nameKey);
}

function buildApiCall(coin, address, token) {
  // Flux Tokens (Flux-ETH, Flux-BSC, Flux-SOL, etc)
  if (token) {
    if (coin === 'FLUX') {
      return `https://explorer.runonflux.io/api/addr/${address}`;
    } if (coin === 'SOL') {
      const avaxconfig = {
        method: 'get',
        url: `https://public-api.solscan.io/account/tokens?account=${address}`,
        headers: {
          'Content-Type': 'application/json',
          token: `${config.solApiKey || process.env.SOL_API_KEY}`,
        },
      };
      return avaxconfig;
    } if (coin === 'BSC') {
      return `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.BSC}&address=${address}&tag=latest&apikey=${config.bscApiKey || process.env.BSC_API_KEY}`;
    } if (coin === 'ETH') {
      return `https://api.etherscan.com/api?module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.ETH}&address=${address}&tag=latest&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
    } if (coin === 'TRON') {
      return `https://apilist.tronscan.org/api/account?address=${address}`;
    } if (coin === 'AVAX') {
      return `https://avascan.info/react-api/network/1/blockchain/all/address/${address}/balance?`;
    } if (coin === 'ERGO') {
      return `https://api.ergoplatform.com/api/v1/addresses/${address}/balance/total`;
    } if (coin === 'KDA') {
      return `${config.kdaTokenApi || process.env.KDA_TOKEN_API}${address}`;
    }
  }

  // Gas Coins (ETH, BNB, AVAX, etc)
  if (coin === 'FLUX') {
    return `https://explorer.runonflux.io/api/addr/${address}`;
  } if (coin === 'SOL') {
    const avaxconfig = {
      method: 'get',
      url: `https://public-api.solscan.io/account/${address}`,
      headers: {
        'Content-Type': 'application/json',
        token: `${config.solApiKey || process.env.SOL_API_KEY}`,
      },
    };
    return avaxconfig;
  } if (coin === 'BSC') {
    return `https://api.bscscan.com/api?module=account&action=balance&address=${address}&apikey=${config.bscApiKey || process.env.BSC_API_KEY}`;
  } if (coin === 'ETH') {
    return `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
  } if (coin === 'TRON') {
    return `https://apilist.tronscan.org/api/account?address=${address}`;
  } if (coin === 'ERGO') {
    return `https://api.ergoplatform.com/api/v1/addresses/${address}/balance/total`;
  } if (coin === 'KDA') {
    return `${config.kdaApi || process.env.KDA_API}${address}`;
  } if (coin === 'AVAX') {
    const postdata = JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [
        `${address}`,
        'latest',
      ],
      id: 1,
    });

    const avaxconfig = {
      method: 'post',
      url: 'https://api.avax.network/ext/bc/C/rpc',
      headers: {
        'Content-Type': 'application/json',
      },
      data: postdata,
    };

    return avaxconfig;
  }
  throw new Error('Invalid coin specified');
}

function hexToDecimal(hex) {
  return parseInt(hex, 16);
}

function parseResponse(item, response, fetchTokens) {
  let balance = 0;
  if (fetchTokens) {
    if (item.coin === 'SOL') {
      const obj = search(config.fluxContractAddresses.SOL, response);
      if (obj) {
        balance = Number(obj.tokenAmount.uiAmount);
      }
    } else if (item.coin === 'BSC') {
      balance = Number(response.result) * 10e-9;
    } else if (item.coin === 'ETH') {
      balance = Number(response.result) * 10e-9;
    } else if (item.coin === 'TRON') {
      const obj = search(config.fluxContractAddresses.TRON, response.trc20token_balances);
      balance = Number(obj.balance) * 10e-9;
    } else if (item.coin === 'AVAX') {
      const obj = search(config.fluxContractAddresses.AVAX, response.tokens);
      balance = Number(obj.balance);
    } else if (item.coin === 'ERGO') {
      const obj = search(config.fluxContractAddresses.ERGO, response.confirmed.tokens);
      balance = Number(obj.amount) * 10e-9;
    } else if (item.coin === 'KDA') {
      if (response.chains) {
        balance = response.chains['0'];
      }
    }
    return balance;
  }

  if (item.coin === 'FLUX') {
    balance = response.balance;
  } else if (item.coin === 'SOL') {
    balance = Number(response.lamports) * 10e-10;
  } else if (item.coin === 'BSC') {
    balance = Number(response.result) * 10e-19;
  } else if (item.coin === 'ETH') {
    balance = Number(response.result) * 10e-19;
  } else if (item.coin === 'TRON') {
    balance = Number(response.balance) * 10e-7;
  } else if (item.coin === 'AVAX') {
    balance = Number(hexToDecimal(response.result)) * 10e-19;
  } else if (item.coin === 'ERGO') {
    balance = Number(response.confirmed.nanoErgs) * 10e-10;
  } else if (item.coin === 'KDA') {
    if (response.chains) {
      balance = response.chains['0'];
    }
  }
  return balance;
}

async function fetchBalances() {
  try {
    const newBalances = [];
    log.info('Refreshing balances');
    // eslint-disable-next-line no-restricted-syntax
    for (const item of addresses) {
      try {
        const apitokenconfig = buildApiCall(item.coin, item.address, true);
        let result;

        if (item.coin === 'SOL') {
          axios(apitokenconfig).then((response) => {
            result = parseResponse(item, response.data, true);
            log.info(`${item.coin}, ${item.address}: ${result}`);
            item.tokenBalance = result;
          })
            .catch((error) => {
              log.error(error);
            });
        } else {
          // eslint-disable-next-line no-await-in-loop
          const response = await axios.get(apitokenconfig);
          // log.info(response.data.confirmed.tokens);
          result = parseResponse(item, response.data, true);
          log.info(`${item.coin}, ${item.address}: ${result}`);
          item.tokenBalance = result;
        }

        // eslint-disable-next-line no-await-in-loop
        await delay(fetchDelay);

        const apiconfig = buildApiCall(item.coin, item.address, false);
        if (item.coin === 'AVAX' || item.coin === 'SOL') {
          axios(apiconfig).then((response) => {
            result = parseResponse(item, response.data, false);
            log.info(`${item.coin}, ${item.address}: ${result}`);
            item.balance = result;
            newBalances.push(item);
            balances[item.address] = item;
          })
            .catch((error) => {
              log.error(error);
            });
        } else {
          // eslint-disable-next-line no-await-in-loop
          const response = await axios.get(apiconfig);
          result = parseResponse(item, response.data, false);
          log.info(`${item.coin}, ${item.address}: ${result}`);
          item.balance = result;
          newBalances.push(item);
          balances[item.address] = item;
        }
        // eslint-disable-next-line no-await-in-loop
        await delay(fetchDelay);
      } catch (error) {
        log.error(error);
      }
    }
  } catch (error) {
    log.error(error);
  }
}

function checkHooks() {
  addresses.forEach((item) => {
    const balanceExists = item.address in balances;
    if (balanceExists) {
      hooks.checkHook(balances[item.address], explorers[item.coin], history);
    } else {
      const adjustedItem = item;
      adjustedItem.balance = -1;
      hooks.checkHook(balances[item.address], explorers[item.coin], history);
    }
  });
}

function getData(req, res) {
  try {
    const response = { data: { balances, explorers } };
    res.json(response);
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: JSON.stringify(error) });
  }
}

function getTest(req, res) {
  try {
    const response = { msg: 'backend works asfds asdfasdfafsd' };
    res.json(response);
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: JSON.stringify(error) });
  }
}

module.exports = {
  checkHooks,
  fetchBalances,
  getData,
  getTest,
};
