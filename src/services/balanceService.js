const config = require('config');
const axios = require('axios');
const dotenv = require('dotenv');
const kadenaPact = require('pact-lang-api');

const log = require('../lib/log');
const hooks = require('../../discord/hooks');

dotenv.config();
const { explorers, addresses } = config;

// Without timeouts a single stalled upstream connection hangs a refresh forever
const REQUEST_TIMEOUT = 30 * 1000;
axios.defaults.timeout = REQUEST_TIMEOUT;

const balances = {};
const history = {};

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// Hard deadline for any request - axios timeout only covers socket inactivity after connect
// and pact-lang-api (node-fetch) has no timeout at all
function withTimeout(promise, ms = REQUEST_TIMEOUT) {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
    return `https://api.etherscan.io/v2/api?chainid=56&module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.BSC}&address=${address}&tag=latest&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
  } if (coin === 'ETH') {
    return `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.ETH}&address=${address}&tag=latest&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
  } if (coin === 'MATIC') {
    return `https://api.etherscan.io/v2/api?chainid=137&module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.MATIC}&address=${address}&tag=latest&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
  } if (coin === 'AVAX') {
    return `https://api.etherscan.io/v2/api?chainid=43114&module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.AVAX}&address=${address}&tag=latest&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
  } if (coin === 'BASE') {
    return `https://api.etherscan.io/v2/api?chainid=8453&module=account&action=tokenbalance&contractaddress=${config.fluxContractAddresses.BASE}&address=${address}&tag=latest&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
  } if (coin === 'KDA') {
    return 'https://api.chainweb-community.org/chainweb/0.0/mainnet01/chain/0/pact';
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
    return `https://api.etherscan.io/v2/api?chainid=56&module=account&action=balance&address=${address}&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
  } if (coin === 'ETH') {
    return `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${address}&tag=latest&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
  } if (coin === 'MATIC') {
    return `https://api.etherscan.io/v2/api?chainid=137&module=account&action=balance&address=${address}&tag=latest&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
  } if (coin === 'AVAX') {
    return `https://api.etherscan.io/v2/api?chainid=43114&module=account&action=balance&address=${address}&tag=latest&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
  } if (coin === 'BASE') {
    return `https://api.etherscan.io/v2/api?chainid=8453&module=account&action=balance&address=${address}&tag=latest&apikey=${config.ethApiKey || process.env.ETH_API_KEY}`;
  } if (coin === 'KDA') {
    return 'https://api.chainweb-community.org/chainweb/0.0/mainnet01/chain/0/pact';
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

// Balances are refreshed on demand only: the page's Refresh button opens
// GET /api/refresh. The old code re-fetched every address in an endless loop
// (one pass, five minutes' sleep, repeat) on every Flux instance. That was
// ~60 Etherscan calls per pass, ~23k a day, out of an Etherscan quota that
// SSP, Zelcore and fusion share.
const ETHERSCAN_COINS = ['BSC', 'ETH', 'MATIC', 'AVAX', 'BASE'];
// One endpoint answers both the coin balance and the FLUX token balance.
const SINGLE_CALL_COINS = ['FLUX', 'ALGO', 'TRON', 'ERGO'];

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && process.env[name] !== '' ? value : fallback;
}

// Etherscan's per-second budget is shared with other services; the public
// Solana RPC rate-limits hard.
const ETHERSCAN_GAP_MS = envNumber('ETHERSCAN_GAP_MS', 250);
const SOL_GAP_MS = envNumber('SOL_GAP_MS', 1500);
const OTHER_GAP_MS = envNumber('OTHER_GAP_MS', 300);
const ETHERSCAN_THROTTLE_RETRIES = 2;
const ETHERSCAN_THROTTLE_BACKOFF_MS = envNumber('ETHERSCAN_THROTTLE_BACKOFF_MS', 1500);

// The refresh endpoint is public, so cap what it can spend. Each instance
// answers a click within REFRESH_MIN_INTERVAL of its last refresh with that
// refresh's data, and runs at most REFRESH_MAX_PER_HOUR refreshes an hour.
// With 3 Flux instances the worst case stays at or below the old loop's usage.
const REFRESH_MIN_INTERVAL_MS = envNumber('REFRESH_MIN_INTERVAL_SECONDS', 60) * 1000;
const REFRESH_MAX_PER_HOUR = envNumber('REFRESH_MAX_PER_HOUR', 6);
const HOUR_MS = 60 * 60 * 1000;
const SSE_HEARTBEAT_MS = 10 * 1000;

let refreshedAt = null;
let lastFailed = 0;
let currentRefresh = null;
const manualRefreshStarts = [];

// Error text goes to the public API, so it must never carry a URL (the
// Etherscan URLs contain the API key). Axios and timeout messages don't.
function shortError(error) {
  const message = (error && error.message) || String(error);
  return message.replace(/https?:\/\/\S+/g, '<url>').slice(0, 160);
}

async function getEtherscan(url) {
  for (let attempt = 0; ; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const { data } = await withTimeout(axios.get(url));
    if (data && data.status === '1') {
      return data;
    }
    const message = data && typeof data.result === 'string' ? data.result : (data && data.message) || 'unexpected response';
    const perSecondThrottle = /rate limit/i.test(message) && !/daily/i.test(message);
    if (!perSecondThrottle || attempt >= ETHERSCAN_THROTTLE_RETRIES) {
      throw new Error(`Etherscan: ${message}`);
    }
    // eslint-disable-next-line no-await-in-loop
    await delay(ETHERSCAN_THROTTLE_BACKOFF_MS * (attempt + 1));
  }
}

async function getKadenaBalance(pactCode, apiHost) {
  const creationTime = Math.round(Date.now() / 1000) - 60;
  // mkMeta takes in account name, chain id, gas price, gas limit, creation time, time-to-live
  const meta = kadenaPact.lang.mkMeta('dummyaccount', '0', 0.00000001, 6000, creationTime, 900);
  const response = await withTimeout(kadenaPact.fetch.local({
    pactCode,
    keyPairs: kadenaPact.crypto.genKeyPair(),
    meta,
  }, apiHost));
  const result = response && response.result;
  if (!result || result.status !== 'success') {
    const reason = result && result.error && result.error.message;
    throw new Error(`Kadena: ${reason || 'no result'}`);
  }
  const { data } = result;
  if (!data || !data.balance) {
    return 0;
  }
  if (typeof data.balance === 'number') {
    return data.balance;
  }
  return data.balance.decimal || 0;
}

// Returns { balance, tokenBalance } for one configured address, or throws.
async function fetchItem(item, pause) {
  const { coin, address } = item;
  if (SINGLE_CALL_COINS.includes(coin)) {
    const { data } = await withTimeout(axios.get(buildApiCall(coin, address, false)));
    return {
      tokenBalance: parseResponse(item, data, true),
      balance: parseResponse(item, data, false),
    };
  }
  if (ETHERSCAN_COINS.includes(coin)) {
    const tokenData = await getEtherscan(buildApiCall(coin, address, true));
    await pause();
    const coinData = await getEtherscan(buildApiCall(coin, address, false));
    return {
      tokenBalance: parseResponse(item, tokenData, true),
      balance: parseResponse(item, coinData, false),
    };
  }
  if (coin === 'SOL') {
    const tokenResponse = await withTimeout(axios(buildApiCall(coin, address, true)));
    await pause();
    const coinResponse = await withTimeout(axios(buildApiCall(coin, address, false)));
    return {
      tokenBalance: parseResponse(item, tokenResponse.data, true),
      balance: parseResponse(item, coinResponse.data, false),
    };
  }
  if (coin === 'KDA') {
    const tokenBalance = await getKadenaBalance(`(runonflux.flux.details "${address}")`, buildApiCall(coin, address, true));
    await pause();
    const balance = await getKadenaBalance(`(coin.details "${address}")`, buildApiCall(coin, address, false));
    return { tokenBalance, balance };
  }
  throw new Error(`Unsupported coin ${coin}`);
}

// A failed address keeps its previous balances and gets an `error` field, so
// the page can mark it instead of silently showing stale numbers.
async function runLane(items, gapMs, onItem) {
  const pause = () => delay(gapMs);
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    try {
      if (i > 0) {
        // eslint-disable-next-line no-await-in-loop
        await pause();
      }
      // eslint-disable-next-line no-await-in-loop
      const { balance, tokenBalance } = await fetchItem(item, pause);
      item.balance = balance;
      item.tokenBalance = tokenBalance;
      item.updatedAt = new Date().toISOString();
      delete item.error;
      log.info(`${item.coin} ${item.label}, ${item.address}: ${balance} / ${tokenBalance}`);
    } catch (error) {
      item.error = shortError(error);
      log.error(`${item.coin} ${item.label}, ${item.address}: ${item.error}`);
    }
    balances[item.address] = item;
    onItem(item);
  }
}

function progressOf(state) {
  return {
    done: state.done,
    total: state.total,
    failed: state.failed,
    current: state.current,
  };
}

function snapshot() {
  return {
    balances,
    explorers,
    refreshedAt,
    failed: lastFailed,
  };
}

// Etherscan, Solana and the rest run as three concurrent lanes, each paced
// for its own upstream.
function startRefresh({ manual }) {
  const state = {
    done: 0,
    total: addresses.length,
    failed: 0,
    current: null,
    listeners: new Set(),
  };
  const onItem = (item) => {
    state.done += 1;
    if (item.error) {
      state.failed += 1;
    }
    state.current = `${item.coin} ${item.label}`;
    state.listeners.forEach((listener) => listener(progressOf(state)));
  };
  if (manual) {
    manualRefreshStarts.push(Date.now());
  }
  log.info(`Refreshing balances (${manual ? 'manual' : 'scheduled'})`);
  state.promise = Promise.all([
    runLane(addresses.filter((item) => ETHERSCAN_COINS.includes(item.coin)), ETHERSCAN_GAP_MS, onItem),
    runLane(addresses.filter((item) => item.coin === 'SOL'), SOL_GAP_MS, onItem),
    runLane(addresses.filter((item) => !ETHERSCAN_COINS.includes(item.coin) && item.coin !== 'SOL'), OTHER_GAP_MS, onItem),
  ]).then(() => {
    refreshedAt = new Date().toISOString();
    lastFailed = state.failed;
    log.info(`Balances refreshed, ${state.failed} of ${state.total} failed`);
  }).catch((error) => {
    log.error(error);
  }).finally(() => {
    currentRefresh = null;
  });
  currentRefresh = state;
  return state;
}

function refreshAllowed() {
  const now = Date.now();
  if (refreshedAt && now - Date.parse(refreshedAt) < REFRESH_MIN_INTERVAL_MS) {
    return { reason: 'recent', retryInSeconds: Math.ceil((Date.parse(refreshedAt) + REFRESH_MIN_INTERVAL_MS - now) / 1000) };
  }
  while (manualRefreshStarts.length && now - manualRefreshStarts[0] >= HOUR_MS) {
    manualRefreshStarts.shift();
  }
  if (manualRefreshStarts.length >= REFRESH_MAX_PER_HOUR) {
    return { reason: 'hourly-cap', limit: REFRESH_MAX_PER_HOUR, retryInSeconds: Math.ceil((manualRefreshStarts[0] + HOUR_MS - now) / 1000) };
  }
  return null;
}

// GET /api/refresh: a Server-Sent Events stream. It sends `progress` events
// while the refresh runs and one `done` event with the full snapshot, all on
// one connection. That matters on Flux: the page calls the API on another
// domain without the FDM sticky cookie, so separate status calls could each
// land on a different instance. A click while this instance is already
// refreshing joins that refresh; a click the limits refuse gets the latest
// snapshot with `limited` set.
function refresh(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const send = (event, payload) => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    }
  };

  let state = currentRefresh;
  if (!state) {
    const limited = refreshAllowed();
    if (limited) {
      send('done', { ...snapshot(), limited });
      res.end();
      return;
    }
    state = startRefresh({ manual: true });
  }

  const listener = (progress) => send('progress', progress);
  // Comment lines keep the proxy's idle timeout from cutting a quiet stream.
  const heartbeat = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(': keep-alive\n\n');
    }
  }, SSE_HEARTBEAT_MS);
  const cleanup = () => {
    clearInterval(heartbeat);
    state.listeners.delete(listener);
  };
  // res 'close' fires on client disconnect; the refresh itself keeps running.
  res.on('close', cleanup);
  state.listeners.add(listener);
  send('progress', progressOf(state));
  state.promise.then(() => {
    send('done', snapshot());
    cleanup();
    res.end();
  });
}

// Opt-in periodic refresh (AUTO_REFRESH_MINUTES) for a deployment that sends
// the Discord low-balance alerts, which need fresh data. Off by default.
function startAutoRefresh(minutes) {
  const run = () => {
    if (!currentRefresh) {
      startRefresh({ manual: false });
    }
  };
  run();
  setInterval(run, minutes * 60 * 1000);
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
    const response = {
      data: {
        ...snapshot(),
        refreshing: currentRefresh ? progressOf(currentRefresh) : null,
      },
    };
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
  getData,
  getTest,
  refresh,
  startAutoRefresh,
};
