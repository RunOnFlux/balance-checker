import './App.css';

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASES = [
  'https://fusionbalancechecker_37599.app.runonflux.io',
  'https://fusionbalancesapi.runonflux.io',
];

// The last snapshot this browser saw. Flux runs several instances and each
// keeps its own data, so page loads show whichever is newer: this or the
// instance that answered.
const CACHE_KEY = 'balanceChecker.lastSnapshot';

const SECTIONS = [
  { coin: 'FLUX', title: 'Flux Balances', tokenColumn: null },
  { coin: 'BSC', title: 'BSC Balances', tokenColumn: 'FLUX-BSC' },
  { coin: 'ETH', title: 'ETH Balances', tokenColumn: 'FLUX-ETH' },
  { coin: 'TRON', title: 'TRON Balances', tokenColumn: 'FLUX-TRON' },
  { coin: 'SOL', title: 'SOL Balances', tokenColumn: 'FLUX-SOL' },
  { coin: 'AVAX', title: 'AVAX Balances', tokenColumn: 'FLUX-AVAX' },
  { coin: 'ERGO', title: 'ERGO Balances', tokenColumn: 'FLUX-ERGO' },
  { coin: 'KDA', title: 'KDA Balances', tokenColumn: 'FLUX-KDA' },
  { coin: 'ALGO', title: 'ALGO Balances', tokenColumn: 'FLUX-ALGO' },
  { coin: 'MATIC', title: 'MATIC Balances', tokenColumn: 'FLUX-MATIC' },
  { coin: 'BASE', title: 'BASE Balances', tokenColumn: 'FLUX-BASE' },
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

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString();
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

function toSnapshot(data) {
  return {
    balances: data.balances || {},
    explorers: data.explorers || {},
    refreshedAt: data.refreshedAt || null,
    failed: data.failed || 0,
  };
}

function Value({ value, error, alert }) {
  const shown = value === undefined || value === null ? '—' : value;
  return (
    <td bgcolor={alert ? 'red' : ''}>
      {shown}
      {error && (
        <span className="stale" title={`Last refresh failed (${error}). Showing the previous value.`}> ⚠</span>
      )}
    </td>
  );
}

function BalanceTable({ section, balances, explorers }) {
  const rows = Object.values(balances).filter((item) => item.coin === section.coin);
  return (
    <div>
      <h2>{section.title}</h2>
      <table className="center">
        <thead>
          <tr>
            <th>Label</th>
            <th>Address</th>
            <th>Balance</th>
            {section.tokenColumn && <th>{section.tokenColumn}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(({
            label, address, ALERT, TOKENALERT, balance, tokenBalance, error,
          }) => {
            const alert = ALERT !== 0 && balance < ALERT;
            const tokenAlert = TOKENALERT !== 0 && tokenBalance < TOKENALERT;
            const anyAlert = alert || (section.tokenColumn && tokenAlert);
            const explorer = explorers[section.coin];
            return (
              <tr key={address}>
                <td bgcolor={anyAlert ? 'red' : ''}>{label}</td>
                <td bgcolor={anyAlert ? 'red' : ''}>
                  {explorer ? <a href={`${explorer}${address}`}>{address}</a> : address}
                </td>
                <Value value={balance} error={error} alert={alert} />
                {section.tokenColumn && <Value value={tokenBalance} error={error} alert={tokenAlert} />}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RefreshStatus({ refresh, snapshot, now }) {
  if (refresh.state === 'connecting') {
    return <div className="status">Starting refresh…</div>;
  }
  if (refresh.state === 'refreshing') {
    return (
      <div className="status">
        <progress value={refresh.done} max={refresh.total || 1} />
        <span>
          {` Refreshing… ${refresh.done} / ${refresh.total} addresses`}
          {refresh.current ? ` (last: ${refresh.current})` : ''}
        </span>
      </div>
    );
  }
  if (refresh.state === 'done') {
    return (
      <div className={refresh.failed ? 'status warn' : 'status ok'}>
        {`✓ Refresh complete at ${formatTime(snapshot.refreshedAt)}.`}
        {refresh.failed > 0 && ` ${refresh.failed} address${refresh.failed === 1 ? '' : 'es'} failed and show their previous value (marked ⚠).`}
      </div>
    );
  }
  if (refresh.state === 'limited') {
    const { reason, retryInSeconds, limit } = refresh.limited;
    const text = reason === 'hourly-cap'
      ? `Refresh limit reached (${limit} per hour per server, to protect the shared Etherscan quota). Showing the latest data. Try again in ${formatWait(retryInSeconds)}.`
      : `Balances were refreshed less than a minute ago, showing those. Try again in ${formatWait(retryInSeconds)}.`;
    return <div className="status warn">{text}</div>;
  }
  if (refresh.state === 'error') {
    return <div className="status error">{refresh.message}</div>;
  }
  if (!snapshot || !snapshot.refreshedAt) {
    return <div className="status">Balances are not loaded yet. Press Refresh balances.</div>;
  }
  return <div className="status">{`Last refreshed ${formatTime(snapshot.refreshedAt)} (${formatAgo(snapshot.refreshedAt, now)}).`}</div>;
}

export default function App() {
  const [snapshot, setSnapshot] = useState(() => readCache());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [refresh, setRefresh] = useState({ state: 'idle' });
  const [now, setNow] = useState(Date.now());
  const baseRef = useRef(null);
  const sourceRef = useRef(null);

  const showSnapshot = useCallback((next) => {
    setSnapshot((previous) => newer(previous, next));
  }, []);

  useEffect(() => {
    writeCache(snapshot);
  }, [snapshot]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // eslint-disable-next-line no-restricted-syntax
      for (const base of API_BASES) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const response = await fetch(`${base}/api/data`);
          if (response.ok) {
            // eslint-disable-next-line no-await-in-loop
            const body = await response.json();
            if (cancelled) return;
            baseRef.current = base;
            showSnapshot(toSnapshot(body.data));
            setLoadError(null);
            return;
          }
        } catch (e) {
          // Try the next API address.
        }
      }
      if (!cancelled) setLoadError('Could not reach the balance API.');
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
  // talks to a single Flux instance.
  const startRefresh = () => {
    if (isBusy) return;
    const base = baseRef.current || API_BASES[0];
    setRefresh({ state: 'connecting' });
    const source = new EventSource(`${base}/api/refresh`);
    sourceRef.current = source;
    let finished = false;
    source.addEventListener('progress', (event) => {
      const progress = JSON.parse(event.data);
      setRefresh({ state: 'refreshing', ...progress });
    });
    source.addEventListener('done', (event) => {
      finished = true;
      source.close();
      sourceRef.current = null;
      const data = JSON.parse(event.data);
      const next = toSnapshot(data);
      if (data.limited) {
        showSnapshot(next);
        setRefresh({ state: 'limited', limited: data.limited });
      } else {
        setSnapshot(next);
        setRefresh({ state: 'done', failed: next.failed });
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

  const balances = (snapshot && snapshot.balances) || {};
  const explorers = (snapshot && snapshot.explorers) || {};

  return (
    <div className="App">
      <h1>Balance Checker</h1>
      <div className="toolbar">
        <button type="button" className="refresh" onClick={startRefresh} disabled={isBusy || loading}>
          {isBusy ? 'Refreshing…' : 'Refresh balances'}
        </button>
        <RefreshStatus refresh={refresh} snapshot={snapshot} now={now} />
      </div>
      {loading && <div>A moment please...</div>}
      {loadError && <div className="status error">{loadError}</div>}
      <div className="wrapper">
        {SECTIONS.map((section) => (
          <BalanceTable key={section.coin} section={section} balances={balances} explorers={explorers} />
        ))}
      </div>
    </div>
  );
}
