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
  // ALGO Key Word
  const algoKeyWord = 'asset-id';

  return object.find((o) => o.tokenAddress === nameKey || o.tokenId === nameKey || o.address === nameKey || o[algoKeyWord] == nameKey);
}

function getTokenBalanceApiCall(coin, address) {
  if (coin === 'SOL') {
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
  } if (coin === 'MATIC') {
    return `https://api.polygonscan.com/api?module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.MATIC}&address=${address}&tag=latest&apikey=${config.maticApiKey || process.env.MATIC_API_KEY}`;
  } if (coin === 'AVAX') {
    return `https://api.snowtrace.io/api?module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.AVAX}&address=${address}&tag=latest&apikey=${config.avaxApiKey || process.env.AVAX_API_KEY}`;
  } if (coin === 'KDA') {
    return `${config.kdaTokenApi || process.env.KDA_TOKEN_API}${address}`;
  }
  throw new Error('Invalid Token Coin Specified');
}

function getGasBalanceApiCall(coin, address) {
  if (coin === 'SOL') {
    const solconfig = {
      method: 'get',
      url: `https://public-api.solscan.io/account/${address}`,
      headers: {
        'Content-Type': 'application/json',
        token: `${config.solApiKey || process.env.SOL_API_KEY}`,
      },
    };
    return solconfig;
  } if (coin === 'BSC') {
    return `https://api.bscscan.com/api?module=account&action=balance&address=${address}&apikey=${config.bscApiKey || process.env.BSC_API_KEY}`;
  } if (coin === 'ETH') {
    return `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
  } if (coin === 'MATIC') {
    return `https://api.polygonscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${config.maticApiKey || process.env.MATIC_API_KEY}`;
  } if (coin === 'AVAX') {
    return `https://api.snowtrace.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${config.avaxApiKey || process.env.AVAX_API_KEY}`;
  } if (coin === 'KDA') {
    return `${config.kdaApi || process.env.KDA_API}${address}`;
  }
  throw new Error('Invalid Gas Coin Specified');
}

function buildApiCall(coin, address, token) {
  try {
    // FLUX, ALGO, TRON, ERGO use the same endpoint no matter if looking for token balance or gas coin balance
    if (coin === 'FLUX') {
      return `https://explorer.runonflux.io/api/addr/${address}`;
    } if (coin === 'ALGO') {
      return `https://mainnet-api.algonode.cloud/v2/accounts/${address}`;
    } if (coin === 'TRON') {
      return `https://apilist.tronscan.org/api/account?address=${address}`;
    } if (coin === 'ERGO') {
      return `https://api.ergoplatform.com/api/v1/addresses/${address}/balance/total`;
    }

    // eslint-disable-next-line no-trailing-spaces
    if (token) {
      // Flux Tokens (FLUX-ETH, FLUX-BSC, FLUX-SOL, FLUX-AVAX, FLUX-KDA)
      return getTokenBalanceApiCall(coin, address);
    }

    // Gas Coins (ETH, BNB, AVAX, etc)
    return getGasBalanceApiCall(coin, address);
  } catch (error) {
    log.error(`Build Api Called Failed with: ${error}`);
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
    } else if (item.coin === 'MATIC') {
      balance = Number(response.result) * 10e-9;
    } else if (item.coin === 'TRON') {
      const obj = search(config.fluxContractAddresses.TRON, response.trc20token_balances);
      balance = Number(obj.balance) * 10e-9;
    } else if (item.coin === 'AVAX') {
      balance = Number(response.result) * 10e-9;
    } else if (item.coin === 'ERGO') {
      const obj = search(config.fluxContractAddresses.ERGO, response.confirmed.tokens);
      balance = Number(obj.amount) * 10e-9;
    } else if (item.coin === 'KDA') {
      if (response.chains) {
        balance = response.chains['0'];
      }
    } else if (item.coin === 'ALGO') {
      if (response.assets) {
        const obj = search(config.fluxContractAddresses.ALGO, response.assets);
        balance = Number(obj.amount) * 10e-9;
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
  } else if (item.coin === 'MATIC') {
    balance = Number(response.result) * 10e-19;
  } else if (item.coin === 'TRON') {
    balance = Number(response.balance) * 10e-7;
  } else if (item.coin === 'AVAX') {
    balance = Number(response.result) * 10e-19;
  } else if (item.coin === 'ERGO') {
    balance = Number(response.confirmed.nanoErgs) * 10e-10;
  } else if (item.coin === 'KDA') {
    if (response.chains) {
      balance = response.chains['0'];
    }
  } else if (item.coin === 'ALGO') {
    balance = Number(response.amount) * 10e-7;
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
