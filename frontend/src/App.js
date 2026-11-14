import './App.css';

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';

const API_BASES = [
  'https://fusionbalancechecker_37599.app.runonflux.io',
  'https://fusionbalancesapi.runonflux.io',
];

// The last snapshot this browser saw. Flux runs several instances and each
// keeps its own data, so page loads show whichever is newest: this or the
// instances that answered.
const CACHE_KEY = 'balanceChecker.lastSnapshot';

const NONE = {};

// `unit` is what the backend's `balance` is in (whole coins, not wei/sun).
const CHAINS = [
  { coin: 'FLUX', name: 'Flux', unit: 'FLUX', token: null },
  { coin: 'BSC', name: 'BNB Smart Chain', unit: 'BNB', token: 'FLUX-BSC' },
  { coin: 'ETH', name: 'Ethereum', unit: 'ETH', token: 'FLUX-ETH' },
  { coin: 'TRON', name: 'TRON', unit: 'TRX', token: 'FLUX-TRON' },
  { coin: 'SOL', name: 'Solana', unit: 'SOL', token: 'FLUX-SOL' },
  { coin: 'AVAX', name: 'Avalanche', unit: 'AVAX', token: 'FLUX-AVAX' },
  { coin: 'ERGO', name: 'Ergo', unit: 'ERG', token: 'FLUX-ERGO' },
  { coin: 'KDA', name: 'Kadena', unit: 'KDA', token: 'FLUX-KDA' },
  { coin: 'ALGO', name: 'Algorand', unit: 'ALGO', token: 'FLUX-ALGO' },
  { coin: 'MATIC', name: 'Polygon', unit: 'POL', token: 'FLUX-MATIC' },
  { coin: 'BASE', name: 'Base', unit: 'ETH', token: 'FLUX-BASE' },
];

function readCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeCache(snapshot) {
  try {
    if (snapshot && snapshot.refreshedAt) {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
    }
  } catch (e) {
    // Storage unavailable (private window, quota): the page works without it.
  }
}

function newer(a, b) {
  if (!a || !a.refreshedAt) return b || a;
  if (!b || !b.refreshedAt) return a;
  return Date.parse(b.refreshedAt) > Date.parse(a.refreshedAt) ? b : a;
}

function valuesOf(snapshot) {
  const values = {};
  Object.values(snapshot.balances || {}).forEach((item) => {
    if (!item.error) {
      values[item.address] = { balance: item.balance, tokenBalance: item.tokenBalance };
    }
  });
  return values;
}

// Moves to `next` when it is newer, keeping the values it replaces so the
// page can show what changed since the previous refresh.
function advance(current, next) {
  if (newer(current, next) !== next) return current;
  if (current && current.refreshedAt && next.refreshedAt && current.refreshedAt !== next.refreshedAt) {
    return { ...next, previous: { refreshedAt: current.refreshedAt, values: valuesOf(current) } };
  }
  return { ...next, previous: current ? current.previous : undefined };
}

function toSnapshot(data) {
  return {
    balances: data.balances || {},
    explorers: data.explorers || {},
    refreshedAt: data.refreshedAt || null,
    failed: data.failed || 0,
  };
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatAgo(iso, now) {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h ${minutes % 60} min ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

function formatWait(seconds) {
  return seconds < 90 ? `${seconds} s` : `${Math.ceil(seconds / 60)} min`;
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '' && !Number.isNaN(Number(value));
}

function formatAmount(value) {
  if (!hasValue(value)) return '—';
  const n = Number(value);
  const abs = Math.abs(n);
  let options = { maximumFractionDigits: 0 };
  if (abs > 0 && abs < 1) options = { maximumSignificantDigits: 3 };
  else if (abs >= 1 && abs < 1000) options = { maximumFractionDigits: 2 };
  return n.toLocaleString('en-US', options);
}

function formatDelta(delta) {
  return `${delta > 0 ? '+' : '−'}${formatAmount(Math.abs(delta))}`;
}

function isLow(value, minimum) {
  return typeof minimum === 'number' && minimum !== 0 && hasValue(value) && Number(value) < minimum;
}

function hasMinimum(minimum) {
  return typeof minimum === 'number' && minimum !== 0;
}

function shortAddress(address) {
  return address.length > 18 ? `${address.slice(0, 8)}…${address.slice(-6)}` : address;
}

function rowStatus(item, chain) {
  const low = isLow(item.balance, item.ALERT);
  const tokenLow = Boolean(chain.token) && isLow(item.tokenBalance, item.TOKENALERT);
  return { low, tokenLow, anyLow: low || tokenLow };
}

function deltaOf(current, previous) {
  if (!hasValue(current) || !hasValue(previous)) return 0;
  const delta = Number(current) - Number(previous);
  return Math.abs(delta) < 1e-9 ? 0 : delta;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (e) {
      // Clipboard blocked: the full address is still in the link's tooltip.
    }
  };
  return (
    <button type="button" className={`icon-button${copied ? ' copied' : ''}`} onClick={copy} aria-label="Copy address" title={copied ? 'Copied' : 'Copy address'}>
      {copied ? (
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" /></svg>
      ) : (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
          <path d="M3 10.5V4a1 1 0 0 1 1-1h6.5" />
        </svg>
      )}
    </button>
  );
}

function Amount({
  value, unit, minimum, low, delta, error,
}) {
  return (
    <td className={`num${low ? ' low' : ''}`} data-label={unit}>
      <span className="amount" title={hasValue(value) ? `${value} ${unit}` : undefined}>
        {formatAmount(value)}
        {error && <span className="stale" title={`Last refresh failed (${error}). Showing the previous value.`}> ⚠</span>}
      </span>
      {delta ? <span className={`delta ${delta > 0 ? 'up' : 'down'}`}>{formatDelta(delta)}</span> : null}
      {hasMinimum(minimum) && <span className="minimum">{`${low ? 'below' : 'min'} ${formatAmount(minimum)}`}</span>}
    </td>
  );
}

function ChainCard({
  chain, rows, explorer, previousValues, live, refreshing, onlyLow,
}) {
  const lowCount = rows.filter((item) => rowStatus(item, chain).anyLow).length;
  const shown = onlyLow ? rows.filter((item) => rowStatus(item, chain).anyLow) : rows;
  if (onlyLow && shown.length === 0) return null;
  return (
    <section className="card" id={`chain-${chain.coin}`}>
      <header className="card-head">
        <h2>{chain.name}</h2>
        <div className="badges">
          {rows.length > 0 && <span className="badge">{`${rows.length} address${rows.length === 1 ? '' : 'es'}`}</span>}
          {lowCount > 0 && <span className="badge low">{`${lowCount} low`}</span>}
        </div>
      </header>
      {shown.length === 0 ? (
        <p className="card-empty">{refreshing ? 'Waiting for this chain…' : 'No balances yet.'}</p>
      ) : (
        <table className="balances">
          <thead>
            <tr>
              <th scope="col">Address</th>
              <th scope="col" className="num">{chain.unit}</th>
              {chain.token && <th scope="col" className="num">{chain.token}</th>}
            </tr>
          </thead>
          <tbody>
            {shown.map((item) => {
              const status = rowStatus(item, chain);
              const previous = item.error ? null : previousValues[item.address];
              const classes = [];
              if (status.anyLow) classes.push('row-low');
              if (refreshing) classes.push(live[item.address] ? 'fresh' : 'waiting');
              return (
                <tr key={item.address} id={`row-${item.address}`} className={classes.join(' ')}>
                  <td className="who">
                    <span className="label">{item.label}</span>
                    <span className="address">
                      {explorer ? (
                        <a href={`${explorer}${item.address}`} target="_blank" rel="noopener noreferrer" title={item.address}>
                          {shortAddress(item.address)}
                        </a>
                      ) : (
                        <span title={item.address}>{shortAddress(item.address)}</span>
                      )}
                      <CopyButton text={item.address} />
                    </span>
                  </td>
                  <Amount
                    value={item.balance}
                    unit={chain.unit}
                    minimum={item.ALERT}
                    low={status.low}
                    delta={previous ? deltaOf(item.balance, previous.balance) : 0}
                    error={item.error}
                  />
                  {chain.token && (
                    <Amount
                      value={item.tokenBalance}
                      unit={chain.token}
                      minimum={item.TOKENALERT}
                      low={status.tokenLow}
                      delta={previous ? deltaOf(item.tokenBalance, previous.tokenBalance) : 0}
                      error={item.error}
                    />
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Attention({ items }) {
  if (items.length === 0) return null;
  return (
    <section className="attention" aria-labelledby="attention-title">
      <h2 id="attention-title">{`Needs attention (${items.length})`}</h2>
      <ul>
        {items.map(({
          key, address, chain, label, what, value, minimum,
        }) => (
          <li key={key}>
            <a href={`#row-${address}`}>
              <span className="attention-where">{`${chain.name} · ${label}`}</span>
              <span className="attention-what">
                {`${formatAmount(value)} ${what}`}
                <span className="minimum">{`min ${formatAmount(minimum)}`}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatusLine({
  refresh, snapshot, now, loading,
}) {
  if (refresh.state === 'connecting') {
    return <p className="status">Starting refresh…</p>;
  }
  if (refresh.state === 'refreshing') {
    const percent = refresh.total ? Math.round((refresh.done / refresh.total) * 100) : 0;
    return (
      <div className="status">
        <div className="bar" role="progressbar" aria-label="Refresh progress" aria-valuemin={0} aria-valuemax={refresh.total || 0} aria-valuenow={refresh.done || 0}>
          <span style={{ width: `${percent}%` }} />
        </div>
        <span>
          {`Refreshing ${refresh.done} of ${refresh.total}`}
          {refresh.failed > 0 ? ` · ${refresh.failed} failed` : ''}
        </span>
      </div>
    );
  }
  if (refresh.state === 'done') {
    return (
      <p className={refresh.failed ? 'status warn' : 'status ok'}>
        {`Refreshed at ${formatTime(snapshot.refreshedAt)}.`}
        {refresh.failed > 0 && (refresh.failed === 1
          ? ' 1 address failed and shows its previous value (⚠).'
          : ` ${refresh.failed} addresses failed and show their previous values (⚠).`)}
      </p>
    );
  }
  if (refresh.state === 'limited') {
    const { reason, retryInSeconds, limit } = refresh.limited;
    const text = reason === 'hourly-cap'
      ? `Refresh limit reached (${limit} per hour per server, to protect the shared Etherscan quota). Showing the latest data. Try again in ${formatWait(retryInSeconds)}.`
      : `Balances were refreshed less than a minute ago, showing those. Try again in ${formatWait(retryInSeconds)}.`;
    return <p className="status warn">{text}</p>;
  }
  if (refresh.state === 'error') {
    return <p className="status error">{refresh.message}</p>;
  }
  if (loading) {
    return <p className="status">Loading…</p>;
  }
  if (!snapshot || !snapshot.refreshedAt) {
    return <p className="status">Not refreshed yet.</p>;
  }
  return <p className="status">{`Last refreshed ${formatTime(snapshot.refreshedAt)} (${formatAgo(snapshot.refreshedAt, now)})`}</p>;
}

export default function App() {
  const [snapshot, setSnapshot] = useState(() => readCache());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [refresh, setRefresh] = useState({ state: 'idle' });
  const [onlyLow, setOnlyLow] = useState(false);
  const [now, setNow] = useState(Date.now());
  const baseRef = useRef(null);
  const sourceRef = useRef(null);

  const showSnapshot = useCallback((next) => {
    setSnapshot((current) => advance(current, next));
  }, []);

  useEffect(() => {
    writeCache(snapshot);
  }, [snapshot]);

  useEffect(() => {
    let cancelled = false;
    // Ask every API address at once and keep the newest answer: each may land
    // on a different Flux instance, and an instance that was just updated has
    // no data until someone refreshes it.
    const load = async () => {
      const answers = await Promise.all(API_BASES.map(async (base) => {
        try {
          const response = await fetch(`${base}/api/data`);
          if (!response.ok) return null;
          const body = await response.json();
          return { base, snapshot: toSnapshot(body.data) };
        } catch (e) {
          return null;
        }
      }));
      if (cancelled) return;
      const ok = answers.filter(Boolean);
      if (ok.length === 0) {
        setLoadError('Could not reach the balance API. Showing the last balances this browser saw, if any.');
        return;
      }
      const best = ok.reduce((a, b) => (newer(a.snapshot, b.snapshot) === b.snapshot ? b : a));
      baseRef.current = best.base;
      ok.forEach((answer) => showSnapshot(answer.snapshot));
      setLoadError(null);
    };
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      if (sourceRef.current) sourceRef.current.close();
    };
  }, [showSnapshot]);

  const isBusy = refresh.state === 'connecting' || refresh.state === 'refreshing';

  // One EventSource carries the progress and the result, so the whole refresh
  // talks to a single Flux instance. Each progress event carries the address
  // that just finished, so its row updates right away.
  const startRefresh = () => {
    if (isBusy) return;
    const base = baseRef.current || API_BASES[0];
    setRefresh({ state: 'connecting', live: {} });
    const source = new EventSource(`${base}/api/refresh`);
    sourceRef.current = source;
    let finished = false;
    source.addEventListener('progress', (event) => {
      const { item, ...progress } = JSON.parse(event.data);
      setRefresh((current) => {
        const live = current.live || {};
        return { ...progress, state: 'refreshing', live: item ? { ...live, [item.address]: item } : live };
      });
    });
    source.addEventListener('done', (event) => {
      finished = true;
      source.close();
      sourceRef.current = null;
      const data = JSON.parse(event.data);
      showSnapshot(toSnapshot(data));
      if (data.limited) {
        setRefresh({ state: 'limited', limited: data.limited });
      } else {
        setRefresh({ state: 'done', failed: data.failed || 0 });
      }
      setNow(Date.now());
    });
    source.onerror = () => {
      if (finished) return;
      source.close();
      sourceRef.current = null;
      setRefresh({
        state: 'error',
        message: 'Lost the connection to the server during the refresh. Wait a minute and press Refresh balances again.',
      });
    };
  };

  const live = refresh.live || NONE;
  const rows = useMemo(() => {
    const base = (snapshot && snapshot.balances) || {};
    return Object.values(isBusy ? { ...base, ...live } : base);
  }, [snapshot, isBusy, live]);
  const explorers = (snapshot && snapshot.explorers) || {};
  const previousValues = (snapshot && snapshot.previous && snapshot.previous.values) || {};

  const attention = useMemo(() => {
    const items = [];
    CHAINS.forEach((chain) => {
      rows.filter((item) => item.coin === chain.coin).forEach((item) => {
        const status = rowStatus(item, chain);
        const common = { address: item.address, chain, label: item.label };
        if (status.low) {
          items.push({
            ...common, key: `${item.address}-native`, what: chain.unit, value: item.balance, minimum: item.ALERT,
          });
        }
        if (status.tokenLow) {
          items.push({
            ...common, key: `${item.address}-token`, what: chain.token, value: item.tokenBalance, minimum: item.TOKENALERT,
          });
        }
      });
    });
    return items;
  }, [rows]);

  const failedCount = rows.filter((item) => item.error).length;
  const hasData = rows.length > 0;

  useEffect(() => {
    document.title = attention.length > 0 ? `(${attention.length} low) Fusion Balance Checker` : 'Fusion Balance Checker';
  }, [attention.length]);

  return (
    <div className="page">
      <header className="top">
        <div className="title">
          <h1>Fusion Balance Checker</h1>
          <StatusLine refresh={refresh} snapshot={snapshot} now={now} loading={loading} />
        </div>
        <button type="button" className="refresh" onClick={startRefresh} disabled={isBusy || loading}>
          <svg viewBox="0 0 16 16" aria-hidden="true" className={isBusy ? 'spin' : ''}>
            <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3" />
          </svg>
          {isBusy ? 'Refreshing…' : 'Refresh balances'}
        </button>
      </header>

      {loadError && <p className="banner error">{loadError}</p>}

      {hasData && (
        <div className="summary">
          <span className="chip">{`${rows.length} addresses`}</span>
          <span className={`chip ${attention.length ? 'low' : 'ok'}`}>{attention.length ? `${attention.length} low` : 'Nothing low'}</span>
          {failedCount > 0 && <span className="chip warn">{`${failedCount} failed`}</span>}
          {snapshot && snapshot.previous && (
            <span className="chip muted" title="Small +/− figures under a balance show the change since this refresh">
              {`Changes since ${formatTime(snapshot.previous.refreshedAt)}`}
            </span>
          )}
          <label className="toggle" htmlFor="only-low">
            <input id="only-low" type="checkbox" checked={onlyLow} onChange={(event) => setOnlyLow(event.target.checked)} />
            Only low balances
          </label>
        </div>
      )}

      <Attention items={attention} />

      {!hasData && !loading && !isBusy && (
        <section className="empty">
          <h2>No balances on this server yet</h2>
          <p>
            Balances load only when someone presses Refresh balances. Each server keeps its own copy and starts
            empty after an update. A refresh takes about a minute.
          </p>
        </section>
      )}

      {(hasData || isBusy) && (
        <main className="grid">
          {CHAINS.map((chain) => (
            <ChainCard
              key={chain.coin}
              chain={chain}
              rows={rows.filter((item) => item.coin === chain.coin)}
              explorer={explorers[chain.coin]}
              previousValues={previousValues}
              live={live}
              refreshing={isBusy}
              onlyLow={onlyLow}
            />
          ))}
        </main>
      )}
    </div>
  );
}
