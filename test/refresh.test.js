/* eslint-disable no-underscore-dangle */
const { expect } = require('chai');
const request = require('supertest');
const axios = require('axios');
const kadenaPact = require('pact-lang-api');
const config = require('config');

// Every upstream is stubbed: these tests never reach Etherscan or any chain.
let calls = [];
let failUrlPart = null;
let throttleOnce = new Set();

function stubResponse(cfg) {
  const url = cfg.url || '';
  if (url.includes('api.etherscan.io')) {
    const params = new URL(url).searchParams;
    const address = params.get('address');
    if (throttleOnce.has(address)) {
      throttleOnce.delete(address);
      return { status: '0', message: 'NOTOK', result: 'Max calls per sec rate limit reached (5/sec)' };
    }
    if (params.get('action') === 'tokenbalance') {
      return { status: '1', message: 'OK', result: '250000000000' };
    }
    return { status: '1', message: 'OK', result: '2000000000000000000' };
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
  if (failUrlPart && (cfg.url || '').includes(failUrlPart)) {
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
    ETHERSCAN_GAP_MS: '0',
    SOL_GAP_MS: '0',
    OTHER_GAP_MS: '0',
    ETHERSCAN_THROTTLE_BACKOFF_MS: '0',
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
    failUrlPart = null;
    throttleOnce = new Set();
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
    failUrlPart = `address=${ethLocked.address}`;
    throttleOnce.add(bscSwap.address);

    const events = await refresh(app);
    const progress = events.filter((e) => e.event === 'progress');
    const done = events[events.length - 1];
    expect(done.event).to.equal('done');
    expect(progress[0].data.done).to.equal(0);
    expect(progress[progress.length - 1].data.done).to.equal(config.addresses.length);
    expect(Object.keys(done.data.balances)).to.have.length(config.addresses.length);
    expect(done.data.refreshedAt).to.be.a('string');
    expect(done.data.failed).to.equal(1);

    const failed = done.data.balances[ethLocked.address];
    expect(failed.error).to.equal('Request failed with status code 502');
    expect(JSON.stringify(done.data)).to.not.match(/apikey/i);

    const throttled = done.data.balances[bscSwap.address];
    expect(throttled.error).to.equal(undefined);
    expect(throttled.balance).to.be.closeTo(2, 1e-9);
    expect(throttled.tokenBalance).to.be.closeTo(2500, 1e-6);

    // FLUX, ALGO, TRON and ERGO need one call each, the rest two.
    const single = config.addresses.filter((a) => ['FLUX', 'ALGO', 'TRON', 'ERGO'].includes(a.coin)).length;
    const kda = config.addresses.filter((a) => a.coin === 'KDA').length;
    // +1 for the throttled retry, -1 because the failing address stops after
    // its first call. Kadena goes through pact-lang-api, not axios.
    const expected = single + (config.addresses.length - single - kda) * 2 + 1 - 1;
    expect(calls).to.have.length(expected);
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
