const config = require('config');
const axios = require('axios');
const dotenv = require('dotenv');
const kadenaPact = require('pact-lang-api');

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

  // eslint-disable-next-line eqeqeq
  return object.find((o) => o.tokenAddress === nameKey || o.tokenId === nameKey || o.address === nameKey || o[algoKeyWord] == nameKey);
}

function getTokenBalanceApiCall(coin, address) {
  if (coin === 'SOL') {
    const data = {
      jsonrpc: '2.0',
      id: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
      method: 'getTokenAccountsByOwner',
      params: [
        address,
        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'jsonParsed', commitment: 'processed' },
      ],
    };
    const avaxconfig = {
      method: 'post',
      url: 'https://api.mainnet-beta.solana.com',
      data,
    };
    return avaxconfig;
  } if (coin === 'BSC') {
    return `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.BSC}&address=${address}&tag=latest&apikey=${config.bscApiKey || process.env.BSC_API_KEY}`;
  } if (coin === 'ETH') {
    return `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.ETH}&address=${address}&tag=latest&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
  } if (coin === 'MATIC') {
    return `https://api.polygonscan.com/api?module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.MATIC}&address=${address}&tag=latest&apikey=${config.maticApiKey || process.env.MATIC_API_KEY}`;
  } if (coin === 'AVAX') {
    return `https://api.snowtrace.io/api?module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.AVAX}&address=${address}&tag=latest&apikey=${config.avaxApiKey || process.env.AVAX_API_KEY}`;
  } if (coin === 'BASE') {
    return `https://api.basescan.org/api?module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.BASE}&address=${address}&tag=latest&apikey=${config.baseApiKey || process.env.BASE_API_KEY}`;
  } if (coin === 'KDA') {
    return 'https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact';
  }
  throw new Error('Invalid Token Coin Specified');
}

function getGasBalanceApiCall(coin, address) {
  if (coin === 'SOL') {
    const data = {
      jsonrpc: '2.0',
      id: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
      method: 'getBalance',
      params: [
        address,
        { encoding: 'jsonParsed', commitment: 'processed' },
      ],
    };
    const solconfig = {
      method: 'post',
      url: 'https://api.mainnet-beta.solana.com',
      data,
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
  } if (coin === 'BASE') {
    return `https://api.basescan.org/api?module=account&action=balance&address=${address}&tag=latest&apikey=${config.baseApiKey || process.env.BASE_API_KEY}`;
  } if (coin === 'KDA') {
    return 'https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact';
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

// eslint-disable-next-line no-unused-vars
function hexToDecimal(hex) {
  return parseInt(hex, 16);
}

function parseResponse(item, response, fetchTokens) {
  let balance = 0;
  if (fetchTokens) {
    if (item.coin === 'SOL') {
      const tokens = response.result.value;
      const fluxToken = tokens.find((tokenBal) => tokenBal.account.data.parsed.info.mint === config.fluxContractAddresses.SOL);
      if (fluxToken) {
        balance = Number((+fluxToken.account.data.parsed.info.tokenAmount.amount / (10 ** fluxToken.account.data.parsed.info.tokenAmount.decimals)).toFixed(fluxToken.account.data.parsed.info.tokenAmount.decimals));
      }
    } else if (item.coin === 'BSC') {
      balance = Number(response.result) * 10e-9;
    } else if (item.coin === 'ETH') {
      balance = Number(response.result) * 10e-9;
    } else if (item.coin === 'MATIC') {
      balance = Number(response.result) * 10e-9;
    } else if (item.coin === 'BASE') {
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
    balance = Number(response.result.value) * 10e-10;
  } else if (item.coin === 'BSC') {
    balance = Number(response.result) * 10e-19;
  } else if (item.coin === 'ETH') {
    balance = Number(response.result) * 10e-19;
  } else if (item.coin === 'MATIC') {
    balance = Number(response.result) * 10e-19;
  } else if (item.coin === 'BASE') {
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
        if (item.coin === 'SOL' || item.coin === 'BSC' || item.coin === 'ETH' || item.coin === 'MATIC') {
          // eslint-disable-next-line no-await-in-loop
          await delay(fetchDelay * 4);
        }

        const apitokenconfig = buildApiCall(item.coin, item.address, true);
        let result;

        if (item.coin === 'SOL') {
          // eslint-disable-next-line no-await-in-loop
          const response = await axios(apitokenconfig).catch((error) => {
            log.error(error);
          });
          result = parseResponse(item, response.data, true);
          log.info(`${item.coin}, ${item.address}: ${result}`);
          item.tokenBalance = result;
        } else if (item.coin === 'KDA') {
          const creationTime = () => Math.round(new Date().getTime() / 1000) - 60;
          // mkMeta takes in account name, chain id, gas price, gas limit, creation time, time-to-live
          const dumMeta = (chainId) => kadenaPact.lang.mkMeta('dummyaccount', chainId.toString(), 0.00000001, 6000, creationTime(), 900);
          // eslint-disable-next-line no-await-in-loop
          const response = await kadenaPact.fetch.local({
            pactCode: `(runonflux.flux.details "${item.address}")`,
            keyPairs: kadenaPact.crypto.genKeyPair(),
            meta: dumMeta('0'),
          }, apitokenconfig).catch((error) => {
            log.error(error);
          });
          let confirmedBal = 0;
          if (response.result.data) {
            if (typeof response.result.data.balance === 'number') {
              confirmedBal = response.result.data.balance;
            } else if (response.result.data.balance.decimal) {
              confirmedBal = response.result.data.balance.decimal;
            } else {
              confirmedBal = 0;
            }
          } else {
            confirmedBal = 0;
          }
          log.info(`${item.coin}, ${item.address}: ${confirmedBal}`);
          item.tokenBalance = confirmedBal;
        } else {
          // eslint-disable-next-line no-await-in-loop
          const response = await axios.get(apitokenconfig);
          // log.info(response.data.confirmed.tokens);
          result = parseResponse(item, response.data, true);
          log.info(`${item.coin}, ${item.address}: ${result}`);
          item.tokenBalance = result;
        }

        if (item.coin === 'SOL' || item.coin === 'BSC' || item.coin === 'ETH' || item.coin === 'MATIC') {
          // eslint-disable-next-line no-await-in-loop
          await delay(fetchDelay * 4);
        }

        const apiconfig = buildApiCall(item.coin, item.address, false);
        if (item.coin === 'SOL') {
          // eslint-disable-next-line no-await-in-loop
          const response = await axios(apiconfig).catch((error) => {
            log.error(error);
          });
          result = parseResponse(item, response.data, false);
          log.info(`${item.coin}, ${item.address}: ${result}`);
          item.balance = result;
          newBalances.push(item);
          balances[item.address] = item;
        } else if (item.coin === 'KDA') {
          const creationTime = () => Math.round(new Date().getTime() / 1000) - 60;
          // mkMeta takes in account name, chain id, gas price, gas limit, creation time, time-to-live
          const dumMeta = (chainId) => kadenaPact.lang.mkMeta('dummyaccount', chainId.toString(), 0.00000001, 6000, creationTime(), 900);
          // eslint-disable-next-line no-await-in-loop
          const response = await kadenaPact.fetch.local({
            pactCode: `(coin.details "${item.address}")`,
            keyPairs: kadenaPact.crypto.genKeyPair(),
            meta: dumMeta('0'),
          }, apiconfig).catch((error) => {
            log.error(error);
          });
          let confirmedBal = 0;
          if (response.result.data) {
            if (typeof response.result.data.balance === 'number') {
              confirmedBal = response.result.data.balance;
            } else if (response.result.data.balance.decimal) {
              confirmedBal = response.result.data.balance.decimal;
            } else {
              confirmedBal = 0;
            }
          } else {
            confirmedBal = 0;
          }
          log.info(`${item.coin}, ${item.address}: ${confirmedBal}`);
          item.balance = confirmedBal;
          newBalances.push(item);
          balances[item.address] = item;
        } else {
          // eslint-disable-next-line no-await-in-loop
          const response = await axios.get(apiconfig);
          result = parseResponse(item, response.data, false);
          log.info(`${item.coin}, ${item.address}: ${result}`);
          item.balance = result;
          newBalances.push(item);
          balances[item.address] = item;
        }
      } catch (error) {
        log.error(error);
      }
    }
  } catch (error) {
    log.error(error);
  } finally {
    log.info('Balances refreshed');
    fetchBalances();
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
