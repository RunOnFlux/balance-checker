import logo from './logo.svg';
import './App.css';
import axios from "axios";

import React, { useState, useEffect } from "react";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetch(
          `http://localhost:9650/api/data`
        );
        if (!response.ok) {
          throw new Error(
            `This is an HTTP error: The status is ${response.status}`
          );
        }
        let actualData = await response.json();
        setData(actualData.data);
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
      <h1>API Posts</h1>
      {loading && <div>A moment please...</div>}
      {error && (
        <div>{`There is a problem fetching the post data - ${error}`}</div>
      )}
        {data &&
          data.map(({ coin, label, address, balance }) => (
            <h3>{coin} - {label} - {address} - {balance}</h3>
          ))
        }

    </div>
  );
}
