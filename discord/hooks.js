const { Webhook } = require('discord-webhook-node');

const hook = new Webhook(`${process.env.WEB_HOOK}`);

const IMAGE_URL = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
hook.setUsername('Discord Webhook Balance Bot Test');
hook.setAvatar(IMAGE_URL);

async function sendHook(coin, label, address, balance, alertamount, explorer) {
  hook.send('@everyone');
  const title = `${label} address ***${address}*** is below the alert balance.
          \nDeposit ${coin} ASAP
          \n`;
  const value = `${balance} < ${alertamount}\n${explorer}${address}`;
  hook.warning(`**${coin} Balance Warning**`, title, value);
}

function checkHook(item, explorer) {
  if (item.ALERT) {
    if (item.balance < item.ALERT) {
      sendHook(item.coin, item.label, item.address, item.balance, item.ALERT, explorer);
    }
  }
}

// hook.send('Testing discord send. Sorry');

module.exports = { checkHook };
