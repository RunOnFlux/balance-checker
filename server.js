const http = require('http');
const config = require('config');
const app = require('./src/lib/server');
const log = require('./src/lib/log');

const balanceService = require('./src/services/balanceService');

const server = http.createServer(app);
const port = process.env.PORT || config.server.port;

try {
  balanceService.fetchBalances();
} catch (error) {
  console.log(error);
}

setInterval(() => {
  try {
    balanceService.checkHooks();
  } catch (error) {
    console.log(error);
  }
}, 10 * 60 * 1000);

server.listen(port, () => {
  log.info(`App listening on port ${port}!`);
});
