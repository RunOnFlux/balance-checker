/* eslint-disable no-underscore-dangle */
const { expect } = require('chai');
const request = require('supertest');
const axios = require('axios');
const kadenaPact = require('pact-lang-api');
const config = require('config');

// Every upstream is stubbed: these tests never reach any chain.
let calls = [];
// Requests whose URL or body contains this string fail with a 502.
let failPart = null;
// The first EVM node of a chain fails once for this address, the second answers.
let firstNodeDownFor = new Set();

const EVM_NODES = new Set(Object.values(config.evmRpcUrls).flat());
const FIRST_NODES = new Set(Object.values(config.evmRpcUrls).map((urls) => urls[0]));

function stubResponse(cfg) {
  const url = cfg.url || '';
  if (EVM_NODES.has(url)) {
    const batch = typeof cfg.data === 'string' ? JSON.parse(cfg.data) : cfg.data;
    // 2 native coins (18 decimals) and 2500 FLUX (8 decimals).
    return batch.map((call) => ({
      jsonrpc: '2.0',
      id: call.id,
      result: call.method === 'eth_getBalance' ? '0x1bc16d674ec80000' : `0x${(250000000000).toString(16).padStart(64, '0')}`,
    })).reverse(); // nodes may answer a batch in any order
  }
  if (url.includes('explorer.runonflux.io')) return { balance: 123 };
  if (url.includes('algonode')) return { amount: 5000000, assets: [{ 'asset-id': 1029804829, amount: 100 }] };
  if (url.includes('tronscan')) return { balance: 1000000, trc20token_balances: [{ tokenId: config.fluxContractAddresses.TRON, balance: '100' }] };
  if (url.includes('ergoplatform')) return { confirmed: { nanoErgs: 1000000000, tokens: [{ tokenId: config.fluxContractAddresses.ERGO, amount: 100 }] } };
  if (url.includes('solana')) {
    const body = typeof cfg.data === 'string' ? JSON.parse(cfg.data) : cfg.data;
    if (body.method === 'getTokenAccountsByOwner') {
      return {
        result: {
          value: [{
            account: { data: { parsed: { info: { mint: config.fluxContractAddresses.SOL, tokenAmount: { amount: '100000000', decimals: 8 } } } } },
          }],
        },
      };
    }
    return { result: { value: 1000000000 } };
  }
  throw new Error(`unexpected url in test: ${url}`);
}

axios.defaults.adapter = async (cfg) => {
  calls.push(cfg.url);
  await new Promise((resolve) => { setTimeout(resolve, 2); });
  const body = typeof cfg.data === 'string' ? cfg.data : JSON.stringify(cfg.data || '');
  const downFor = [...firstNodeDownFor].find((address) => body.includes(address));
  if (downFor && FIRST_NODES.has(cfg.url)) {
    firstNodeDownFor.delete(downFor);
    const error = new Error('timeout of 10000ms exceeded');
    error.config = cfg;
    throw error;
  }
  if (failPart && ((cfg.url || '').includes(failPart) || body.includes(failPart))) {
    const error = new Error('Request failed with status code 502');
    error.config = cfg;
    throw error;
  }
  return {
    data: stubResponse(cfg), status: 200, statusText: 'OK', headers: {}, config: cfg, request: {},
  };
};
kadenaPact.fetch.local = async () => ({ result: { status: 'success', data: { balance: 7 } } });

function loadApp(env) {
  Object.assign(process.env, {
    EVM_GAP_MS: '0',
    SOL_GAP_MS: '0',
    OTHER_GAP_MS: '0',
    REFRESH_MIN_INTERVAL_SECONDS: '60',
    REFRESH_MAX_PER_HOUR: '6',
    ...env,
  });
  ['../src/services/balanceService', '../src/routes', '../src/lib/server'].forEach((m) => {
    delete require.cache[require.resolve(m)];
  });
  // eslint-disable-next-line global-require
  return require('../src/lib/server');
}

function sseParser(res, callback) {
  let text = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { text += chunk; });
  res.on('end', () => callback(null, text));
}

function parseEvents(text) {
  return text.split('\n\n').filter((block) => block.startsWith('event:')).map((block) => {
    const [eventLine, dataLine] = block.split('\n');
    return { event: eventLine.slice('event: '.length), data: JSON.parse(dataLine.slice('data: '.length)) };
  });
}

async function refresh(app) {
  const res = await request(app).get('/api/refresh').buffer(true).parse(sseParser);
  expect(res.status).to.equal(200);
  expect(res.headers['content-type']).to.contain('text/event-stream');
  return parseEvents(res.body);
}

describe('on-demand balance refresh', () => {
  beforeEach(() => {
    calls = [];
    failPart = null;
    firstNodeDownFor = new Set();
  });

  it('does not fetch anything until asked', async () => {
    const app = loadApp();
    await new Promise((resolve) => { setTimeout(resolve, 50); });
    const res = await request(app).get('/api/data');
    expect(res.body.data.refreshedAt).to.equal(null);
    expect(res.body.data.balances).to.deep.equal({});
    expect(res.body.data.refreshing).to.equal(null);
    expect(calls).to.have.length(0);
  });

  it('streams progress and finishes with every address', async () => {
    const app = loadApp();
    const ethLocked = config.addresses.find((a) => a.coin === 'ETH' && a.label === 'LOCKED');
    const bscSwap = config.addresses.find((a) => a.coin === 'BSC' && a.label === 'SWAP');
    failPart = ethLocked.address;
    firstNodeDownFor.add(bscSwap.address);

    const events = await refresh(app);
    const progress = events.filter((e) => e.event === 'progress');
    const done = events[events.length - 1];
    expect(done.event).to.equal('done');
    expect(progress[0].data.done).to.equal(0);
    expect(progress[progress.length - 1].data.done).to.equal(config.addresses.length);
    // Every finished address arrives with its progress event.
    const items = progress.filter((e) => e.data.item).map((e) => e.data.item);
    expect(items.map((i) => i.address).sort()).to.deep.equal(config.addresses.map((a) => a.address).sort());
    expect(items.find((i) => i.address === ethLocked.address).error).to.equal('Request failed with status code 502');
    expect(items.find((i) => i.address === bscSwap.address).tokenBalance).to.be.closeTo(2500, 1e-6);
    expect(JSON.stringify(progress)).to.not.match(/apikey/i);
    expect(Object.keys(done.data.balances)).to.have.length(config.addresses.length);
    expect(done.data.refreshedAt).to.be.a('string');
    expect(done.data.failed).to.equal(1);

    const failed = done.data.balances[ethLocked.address];
    expect(failed.error).to.equal('Request failed with status code 502');
    expect(JSON.stringify(done.data)).to.not.match(/apikey/i);

    // The first BSC node timed out for this address; the second answered.
    const fallback = done.data.balances[bscSwap.address];
    expect(fallback.error).to.equal(undefined);
    expect(fallback.balance).to.equal(2);
    expect(fallback.tokenBalance).to.equal(2500);
    // No EVM balance goes to Etherscan any more.
    expect(calls.filter((url) => (url || '').includes('etherscan'))).to.have.length(0);

    // FLUX, ALGO, TRON and ERGO need one call each, Solana two, and an EVM
    // address one batch. Kadena goes through pact-lang-api, not axios.
    const count = (coins) => config.addresses.filter((a) => coins.includes(a.coin)).length;
    const single = count(['FLUX', 'ALGO', 'TRON', 'ERGO']);
    const sol = count(['SOL']);
    const evm = count(['BSC', 'ETH', 'MATIC', 'AVAX', 'BASE']);
    // +1: the failing ETH address is tried on both ETH nodes.
    // +1: the BSC address whose first node timed out.
    const expected = single + sol * 2 + evm + 1 + 1;
    expect(calls).to.have.length(expected);
    const evmBatches = calls.filter((url) => EVM_NODES.has(url));
    expect(evmBatches).to.have.length(evm + 2);
  });

  it('answers a second click within the minimum interval from the last refresh', async () => {
    const app = loadApp();
    await refresh(app);
    const before = calls.length;
    const events = await refresh(app);
    expect(events).to.have.length(1);
    expect(events[0].event).to.equal('done');
    expect(events[0].data.limited.reason).to.equal('recent');
    expect(events[0].data.limited.retryInSeconds).to.be.within(1, 60);
    expect(calls.length).to.equal(before);
  });

  it('caps refreshes per hour', async () => {
    const app = loadApp({ REFRESH_MIN_INTERVAL_SECONDS: '0', REFRESH_MAX_PER_HOUR: '2' });
    await refresh(app);
    await refresh(app);
    const before = calls.length;
    const events = await refresh(app);
    expect(events[0].data.limited.reason).to.equal('hourly-cap');
    expect(events[0].data.limited.retryInSeconds).to.be.within(3500, 3600);
    expect(calls.length).to.equal(before);
  });

  it('joins a refresh that is already running instead of starting another', async () => {
    const app = loadApp({ REFRESH_MIN_INTERVAL_SECONDS: '0' });
    await refresh(app);
    const perRefresh = calls.length;
    calls = [];
    const [first, second] = await Promise.all([refresh(app), refresh(app)]);
    expect(first[first.length - 1].event).to.equal('done');
    expect(second[second.length - 1].event).to.equal('done');
    expect(calls.length).to.equal(perRefresh);
    const data = await request(app).get('/api/data');
    expect(data.body.data.refreshing).to.equal(null);
  });
});
