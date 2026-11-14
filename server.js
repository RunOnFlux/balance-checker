const http = require('http');
const config = require('config');
const app = require('./src/lib/server');
const log = require('./src/lib/log');

const balanceService = require('./src/services/balanceService');

const server = http.createServer(app);
const port = process.env.PORT || config.server.port;

// No automatic refresh by default: balances refresh when someone presses
// Refresh on the page (GET /api/refresh). Set AUTO_REFRESH_MINUTES only on a
// deployment that sends the Discord low-balance alerts.
const autoRefreshMinutes = Number(process.env.AUTO_REFRESH_MINUTES) || 0;
if (autoRefreshMinutes > 0) {
  balanceService.startAutoRefresh(autoRefreshMinutes);
}

if (!process.env.FLUXOS) {
  setInterval(() => {
    try {
      balanceService.checkHooks();
    } catch (error) {
      console.log(error);
    }
  }, 10 * 60 * 1000);
}

server.listen(port, () => {
  log.info(`App listening on port ${port}!`);
});
