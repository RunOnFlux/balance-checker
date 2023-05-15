const fs = require('fs');
const log = require('../lib/log');

function storeData(data, path) {
  try {
    log.info(`Storing balances: ${data}`);
    fs.writeFileSync(path, JSON.stringify(data));
  } catch (err) {
    log.error(err);
  }
}

function loadData(path) {
  try {
    return fs.readFileSync(path, 'utf8');
  } catch (err) {
    log.error(err);
    return false;
  }
}

module.exports = {
  storeData,
  loadData,
};
