import './App.css';

import React, { useState, useEffect } from "react";

export default function App() {
  const [data, setData] = useState(null);
  const [explorers, setExplorers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  

  useEffect(() => {
    const getData = async () => {
      try {
        let response = await fetch(
          'https://fusionbalancechecker_37599.app.runonflux.io/api/data'
        )
        if (!response || !response.ok) {
          response = await fetch(
            'https://fusionbalancesapi.runonflux.io/api/data'
          );
        }
        if (!response || !response.ok) {
          response = await fetch(
            'http://164.92.144.155:9661/api/data'
          );
        }
        if (!response || !response.ok) {
          throw new Error(
            `This is an HTTP error: The status is ${response.status}`
          );
        }
        let actualData = await response.json();
        setData(actualData.data.balances);
        setExplorers(actualData.data.explorers);
        setError(null);
      } catch(err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }  
    }
    getData()
  
  }, [])

  return (
    <div className="App">
      <h1>Balance Checker</h1>
      {loading && <div>A moment please...</div>}
      {error && (
        <div>{`There is a problem fetching the post data - ${error}`}</div>
      )}
      <div class="wrapper">
        <div>
          <h2>Flux Balances</h2>
          <table class="center">
            <tr>
              <th>Label</th>
              <th>Address</th>
              <th>Balance</th>
            </tr>
            {data && Object.values(data).map(({coin, label, address, ALERT, TOKENALERT, balance, tokenBalance}, key) => {
              if (coin === 'FLUX') {
                var alert = balance < ALERT;
                if (ALERT === 0 ) {
                  alert = false;
                }
                var tokenalert = tokenBalance < TOKENALERT;
                if (TOKENALERT === 0 ) {
                  tokenalert = false;
                }
                var link = `${explorers[coin]}${address}`;
                return (
                  <tr key={key}>
                    <td bgcolor={alert || tokenalert ? 'red' : ''}>{label}</td>
                    <td bgcolor={alert || tokenalert ? 'red' : ''}><a href={link}>{address}</a></td>
                    <td bgcolor={alert ? 'red' : ''}>{balance}</td>
                  </tr>
                )
              }
              return null;
            })}
          </table>
        </div>
        <div>
          <h2>BSC Balances</h2>
          <table class="center">
            <tr>
              <th>Label</th>
              <th>Address</th>
              <th>Balance</th>
              <th>FLUX-BSC</th>
            </tr>
            {data && Object.values(data).map(({coin, label, address, ALERT, TOKENALERT, balance, tokenBalance}, key) => {
              if (coin === 'BSC') {
                var alert = balance < ALERT;
                if (ALERT === 0 ) {
                  alert = false;
                }
                var tokenalert = tokenBalance < TOKENALERT;
                if (TOKENALERT === 0 ) {
                  tokenalert = false;
                }
                var link = `${explorers[coin]}${address}`;
                return (
                  <tr key={key}>
                    <td bgcolor={alert || tokenalert ? 'red' : ''}>{label}</td>
                    <td bgcolor={alert || tokenalert ? 'red' : ''}><a href={link}>{address}</a></td>
                    <td bgcolor={alert ? 'red' : ''}>{balance}</td>
                    <td bgcolor={tokenalert ? 'red' : ''}>{tokenBalance}</td>
                  </tr>
                )
              }
              return null;
            })}
          </table>
        </div>
      <div>
        <h2>ETH Balances</h2>
        <table class="center">
          <tr>
            <th>Label</th>
            <th>Address</th>
            <th>Balance</th>
            <th>FLUX-ETH</th>
          </tr>
          {data && Object.values(data).map(({coin, label, address, ALERT, TOKENALERT, balance, tokenBalance}, key) => {
            if (coin === 'ETH') {
              var alert = balance < ALERT;
                if (ALERT === 0 ) {
                  alert = false;
                }
                var tokenalert = tokenBalance < TOKENALERT;
                if (TOKENALERT === 0 ) {
                  tokenalert = false;
                }
                var link = `${explorers[coin]}${address}`;
                return (
                  <tr key={key}>
                    <td bgcolor={alert || tokenalert ? 'red' : ''}>{label}</td>
                    <td bgcolor={alert || tokenalert ? 'red' : ''}><a href={link}>{address}</a></td>
                    <td bgcolor={alert ? 'red' : ''}>{balance}</td>
                    <td bgcolor={tokenalert ? 'red' : ''}>{tokenBalance}</td>
                  </tr>
                )
            } else {
              return null;
            }
          })}
        </table>
      </div>
      <div>
        <h2>TRON Balances</h2>
        <table class="center">
          <tr>
            <th>Label</th>
            <th>Address</th>
            <th>Balance</th>
            <th>FLUX-TRON</th>
          </tr>
          {data && Object.values(data).map(({coin, label, address, ALERT, TOKENALERT, balance, tokenBalance}, key) => {
            if (coin === 'TRON'){
              var alert = balance < ALERT;
              if (ALERT === 0 ) {
                alert = false;
              }
              var tokenalert = tokenBalance < TOKENALERT;
                if (TOKENALERT === 0 ) {
                  tokenalert = false;
                }
              var link = `${explorers[coin]}${address}`;
                return (
                  <tr key={key}>
                    <td bgcolor={alert || tokenalert ? 'red' : ''}>{label}</td>
                    <td bgcolor={alert || tokenalert ? 'red' : ''}><a href={link}>{address}</a></td>
                    <td bgcolor={alert ? 'red' : ''}>{balance}</td>
                    <td bgcolor={tokenalert ? 'red' : ''}>{tokenBalance}</td>
                  </tr>
                )
            }
            return null;
          })}
        </table>
      </div>
      <div>
        <h2>SOL Balances</h2>
        <table class="center">
          <tr>
            <th>Label</th>
            <th>Address</th>
            <th>Balance</th>
            <th>FLUX-SOL</th>
          </tr>
          {data && Object.values(data).map(({coin, label, address, ALERT, TOKENALERT, balance, tokenBalance}, key) => {
            if (coin === 'SOL'){
              var alert = balance < ALERT;
              if (ALERT === 0 ) {
                alert = false;
              }
              var tokenalert = tokenBalance < TOKENALERT;
                if (TOKENALERT === 0 ) {
                  tokenalert = false;
                }
              var link = `${explorers[coin]}${address}`;
              return (
                <tr key={key}>
                  <td bgcolor={alert || tokenalert ? 'red' : ''}>{label}</td>
                    <td bgcolor={alert || tokenalert ? 'red' : ''}><a href={link}>{address}</a></td>
                    <td bgcolor={alert ? 'red' : ''}>{balance}</td>
                    <td bgcolor={tokenalert ? 'red' : ''}>{tokenBalance}</td>
                </tr>
              )
            }
            return null;
          })}
        </table>
      </div>
      <div>
        <h2>AVAX Balances</h2>
        <table class="center">
          <tr>
            <th>Label</th>
            <th>Address</th>
            <th>Balance</th>
            <th>FLUX-AVAX</th>
          </tr>
          {data && Object.values(data).map(({coin, label, address, ALERT, TOKENALERT, balance, tokenBalance}, key) => {
            if (coin === 'AVAX'){
              var alert = balance < ALERT;
              if (ALERT === 0 ) {
                alert = false;
              }
              var tokenalert = tokenBalance < TOKENALERT;
                if (TOKENALERT === 0 ) {
                  tokenalert = false;
                }
              var link = `${explorers[coin]}${address}`;
              return (
                <tr key={key}>
                  <td bgcolor={alert || tokenalert ? 'red' : ''}>{label}</td>
                    <td bgcolor={alert || tokenalert ? 'red' : ''}><a href={link}>{address}</a></td>
                    <td bgcolor={alert ? 'red' : ''}>{balance}</td>
                    <td bgcolor={tokenalert ? 'red' : ''}>{tokenBalance}</td>
                </tr>
              )
            }
            return null;
          })}
        </table>
      </div>
      <div>
        <h2>ERGO Balances</h2>
        <table class="center">
          <tr>
            <th>Label</th>
            <th>Address</th>
            <th>Balance</th>
            <th>FLUX-ERGO</th>
          </tr>
          {data && Object.values(data).map(({coin, label, address, ALERT, TOKENALERT, balance, tokenBalance}, key) => {
            if (coin === 'ERGO'){
              var alert = balance < ALERT;
              if (ALERT === 0 ) {
                alert = false;
              }
              var tokenalert = tokenBalance < TOKENALERT;
              if (TOKENALERT === 0 ) {
                tokenalert = false;
              }
              var link = `${explorers[coin]}${address}`;
              return (
                <tr key={key}>
                  <td bgcolor={alert || tokenalert ? 'red' : ''}>{label}</td>
                  <td bgcolor={alert || tokenalert ? 'red' : ''}><a href={link}>{address}</a></td>
                  <td bgcolor={alert ? 'red' : ''}>{balance}</td>
                  <td bgcolor={tokenalert ? 'red' : ''}>{tokenBalance}</td>
                </tr>
              )
            }
            return null;
          })}
        </table>
        </div>
        <div>
        <h2>KDA Balances</h2>
        <table class="center">
          <tr>
            <th>Label</th>
            <th>Address</th>
            <th>Balance</th>
            <th>FLUX-KDA</th>
          </tr>
          {data && Object.values(data).map(({coin, label, address, ALERT, TOKENALERT, balance, tokenBalance}, key) => {
            if (coin === 'KDA'){
              var alert = balance < ALERT;
              if (ALERT === 0 ) {
                alert = false;
              }
              var tokenalert = tokenBalance < TOKENALERT;
              if (TOKENALERT === 0 ) {
                tokenalert = false;
              }
              var link = `${explorers[coin]}${address}`;
              return (
                <tr key={key}>
                  <td bgcolor={alert || tokenalert ? 'red' : ''}>{label}</td>
                  <td bgcolor={alert || tokenalert ? 'red' : ''}><a href={link}>{address}</a></td>
                  <td bgcolor={alert ? 'red' : ''}>{balance}</td>
                  <td bgcolor={tokenalert ? 'red' : ''}>{tokenBalance}</td>
                </tr>
              )
            }
            return null;
          })}
        </table>
        </div>
        <div>
        <h2>ALGO Balances</h2>
        <table class="center">
          <tr>
            <th>Label</th>
            <th>Address</th>
            <th>Balance</th>
            <th>FLUX-ALGO</th>
          </tr>
          {data && Object.values(data).map(({coin, label, address, ALERT, TOKENALERT, balance, tokenBalance}, key) => {
            if (coin === 'ALGO'){
              var alert = balance < ALERT;
              if (ALERT === 0 ) {
                alert = false;
              }
              var tokenalert = tokenBalance < TOKENALERT;
              if (TOKENALERT === 0 ) {
                tokenalert = false;
              }
              var link = `${explorers[coin]}${address}`;
              return (
                <tr key={key}>
                  <td bgcolor={alert || tokenalert ? 'red' : ''}>{label}</td>
                  <td bgcolor={alert || tokenalert ? 'red' : ''}><a href={link}>{address}</a></td>
                  <td bgcolor={alert ? 'red' : ''}>{balance}</td>
                  <td bgcolor={tokenalert ? 'red' : ''}>{tokenBalance}</td>
                </tr>
              )
            }
            return null;
          })}
        </table>
        </div>
        <div>
        <h2>MATIC Balances</h2>
        <table class="center">
          <tr>
            <th>Label</th>
            <th>Address</th>
            <th>Balance</th>
            <th>FLUX-MATIC</th>
          </tr>
          {data && Object.values(data).map(({coin, label, address, ALERT, TOKENALERT, balance, tokenBalance}, key) => {
            if (coin === 'MATIC'){
              var alert = balance < ALERT;
              if (ALERT === 0 ) {
                alert = false;
              }
              var tokenalert = tokenBalance < TOKENALERT;
              if (TOKENALERT === 0 ) {
                tokenalert = false;
              }
              var link = `${explorers[coin]}${address}`;
              return (
                <tr key={key}>
                  <td bgcolor={alert || tokenalert ? 'red' : ''}>{label}</td>
                  <td bgcolor={alert || tokenalert ? 'red' : ''}><a href={link}>{address}</a></td>
                  <td bgcolor={alert ? 'red' : ''}>{balance}</td>
                  <td bgcolor={tokenalert ? 'red' : ''}>{tokenBalance}</td>
                </tr>
              )
            }
            return null;
          })}
        </table>
        </div>
        <div>
        <h2>BASE Balances</h2>
        <table class="center">
          <tr>
            <th>Label</th>
            <th>Address</th>
            <th>Balance</th>
            <th>FLUX-BASE</th>
          </tr>
          {data && Object.values(data).map(({coin, label, address, ALERT, TOKENALERT, balance, tokenBalance}, key) => {
            if (coin === 'BASE'){
              var alert = balance < ALERT;
              if (ALERT === 0 ) {
                alert = false;
              }
              var tokenalert = tokenBalance < TOKENALERT;
              if (TOKENALERT === 0 ) {
                tokenalert = false;
              }
              var link = `${explorers[coin]}${address}`;
              return (
                <tr key={key}>
                  <td bgcolor={alert || tokenalert ? 'red' : ''}>{label}</td>
                  <td bgcolor={alert || tokenalert ? 'red' : ''}><a href={link}>{address}</a></td>
                  <td bgcolor={alert ? 'red' : ''}>{balance}</td>
                  <td bgcolor={tokenalert ? 'red' : ''}>{tokenBalance}</td>
                </tr>
              )
            }
            return null;
          })}
        </table>
        </div>
      </div>
    </div>
  );
}
