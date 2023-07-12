module.exports = {
  server: {
    port: 4444,
  },
  explorers: {
    FLUX: 'https://explorer.runonflux.io/address/',
    TRON: 'https://tronscan.org/#/address/',
    ETH: 'https://etherscan.io/address/',
    BSC: 'https://bscscan.com/address/',
    SOL: 'https://solscan.io/account/',
    AVAX: 'https://avascan.info/blockchain/c/address/',
    ERGO: 'https://explorer.ergoplatform.com/en/addresses/',
    KDA: 'https://explorer.chainweb.com/mainnet/account/',
    ALGO: 'https://algoexplorer.io/address/',
    MATIC: 'https://polygonscan.com/address/',
  },
  fluxContractAddresses: {
    ETH: '0x720CD16b011b987Da3518fbf38c3071d4F0D1495',
    BSC: '0xaFF9084f2374585879e8B434C399E29E80ccE635',
    SOL: 'FLUX1wa2GmbtSB6ZGi2pTNbVCw3zEeKnaPCkPtFXxqXe',
    TRON: 'TWr6yzukRwZ53HDe3bzcC8RCTbiKa4Zzb6',
    AVAX: '0xc4B06F17ECcB2215a5DBf042C672101Fc20daF55',
    ERGO: 'e8b20745ee9d18817305f32eb21015831a48f02d40980de6e849f886dca7f807',
    ALGO: '1029804829',
    MATIC: '0xA2bb7A68c46b53f6BbF6cC91C865Ae247A82E99B',
  },
  fetchDelay: 1100, // in case of missing api key
  bscApiKey: '',
  ethApiKey: '',
  solApiKey: '',
  maticApiKey: '',
  avaxApiKey: '',
  discordHook: '',
  kdaApi: '',
  kdaTokenApi: '',
  addresses: [
    {
      coin: 'FLUX', label: 'SNAPSHOT', address: 't1UwmAPJ1kv1qy6hV93nL5d5pQezBL55TgN', ALERT: 0,
    },
    {
      coin: 'FLUX', label: 'MINING', address: 't1Yum7okNzR5kW84dfgwqB23yy1BCcpHFPq', ALERT: 0,
    },
    {
      coin: 'FLUX', label: 'SWAP', address: 't1abAp9oZenibGLFuZKyUjmL6FiATTaCYaj', ALERT: 1,
    },
    {
      coin: 'FLUX', label: 'COLD', address: 't1cjcLaDHkNcuXh6uoyNL7u1jx7GxvzfYAN', ALERT: 0,
    },
    {
      coin: 'SOL', label: 'SNAPSHOT', address: '94W7UnJTBNEQSAk854NLTBgbqzSqHQNyFtQYPiGzNFaA', ALERT: 0.001, TOKENALERT: 1000,
    },
    {
      coin: 'SOL', label: 'MINING', address: '9dfk2Rq1MnuvjQvTsBkWvncpvQsuR8vrioFzkFG7HKvW', ALERT: 0.001, TOKENALERT: 1000,
    },
    {
      coin: 'SOL', label: 'SWAP', address: 'CCafnH2sUhPHitQWyFLDCe3Xqwz1Vrc2caNR6PAwkPzP', ALERT: 0.001, TOKENALERT: 1000,
    },
    {
      coin: 'SOL', label: 'COLD', address: '98duys57BNeYNdA4JPYzkraXe1XoUYXq5MMesx1JLsFY', ALERT: 0.001, TOKENALERT: 1000,
    },
    {
      coin: 'BSC', label: 'SNAPSHOT', address: '0x4004755e538b77f80004b0f9b7f7df4e9793e584', ALERT: 0.01, TOKENALERT: 1000,
    },
    {
      coin: 'BSC', label: 'MINING', address: '0x8cb191750096ddc8f314c2de6ef28331503774e9', ALERT: 0.01, TOKENALERT: 1000,
    },
    {
      coin: 'BSC', label: 'SWAP', address: '0x9b192227da99b5a50d037b10c965609ed83c43d7', ALERT: 0.01, TOKENALERT: 1000,
    },
    {
      coin: 'BSC', label: 'COLD', address: '0x5b79692e093c70e47070f525b593cc35b5adf530', ALERT: 0, TOKENALERT: 1000,
    },
    {
      coin: 'ETH', label: 'SNAPSHOT', address: '0x5a2387883bc5e875e09d533eef812b2da30f2615', ALERT: 0.1, TOKENALERT: 1000,
    },
    {
      coin: 'ETH', label: 'MINING', address: '0x342c34702929849b6deaa47496d211cbe4167fa5', ALERT: 0.1, TOKENALERT: 1000,
    },
    {
      coin: 'ETH', label: 'SWAP', address: '0x134e4c74c670adefdcb2476df6960d9297bc7dad', ALERT: 0.1, TOKENALERT: 1000,
    },
    {
      coin: 'ETH', label: 'COLD', address: '0xa23702e9349fbf9939864da1245f5b358e7ef30b', ALERT: 0, TOKENALERT: 1000,
    },
    {
      coin: 'TRON', label: 'SNAPSHOT', address: 'TSHXNnsrKGf6KAfosq5mckCnaY7gUfGwBJ', ALERT: 100, TOKENALERT: 1000,
    },
    {
      coin: 'TRON', label: 'MINING', address: 'TVkT9g2zzgcztm81RozqBA1UbwzZpoN8cM', ALERT: 100, TOKENALERT: 1000,
    },
    {
      coin: 'TRON', label: 'SWAP', address: 'TA7U2PTnHDyhHBns3X6NsDndjZDBUE3oUa', ALERT: 100, TOKENALERT: 1000,
    },
    {
      coin: 'TRON', label: 'COLD', address: 'THV8NGvAwyaL22kkhkXHVhL7JBDyxRs3BZ', ALERT: 0, TOKENALERT: 1000,
    },
    {
      coin: 'AVAX', label: 'SNAPSHOT', address: '0x1F3b258e0ff097FC4E25B827401D10fDeAa71fC5', ALERT: 1, TOKENALERT: 1000,
    },
    {
      coin: 'AVAX', label: 'MINING', address: '0x8967d37E297f6f6ede242d51783917eb07fDE293', ALERT: 1, TOKENALERT: 1000,
    },
    {
      coin: 'AVAX', label: 'SWAP', address: '0xe0d28bc942B7B0b9A513F92a2fCef2bdF0377619', ALERT: 1, TOKENALERT: 1000,
    },
    {
      coin: 'AVAX', label: 'COLD', address: '0xBdB587D89929b3188325643800f8f789Bf72FF53', ALERT: 0, TOKENALERT: 1000,
    },
    {
      coin: 'ERGO', label: 'SNAPSHOT', address: '9hhRnDa1Hih5TepwqK1Zbb8SGYUbFpqTwE9G78yffudKq59xTa9', ALERT: 0, TOKENALERT: 1000,
    },
    {
      coin: 'ERGO', label: 'MINING', address: '9hZ9ygGKcQ9z1oaYQEmNF53aiNQTazhBo9DFC8tQsR47a15ueGw', ALERT: 2, TOKENALERT: 1000,
    },
    {
      coin: 'ERGO', label: 'SWAP', address: '9fCKJ7g6ZffHAQb9UQY7S6YLF6dRVejBAXw284XNazkq8XLuZbw', ALERT: 2, TOKENALERT: 1000,
    },
    {
      coin: 'ERGO', label: 'COLD', address: '9gtdyNTVfziFsGzH7KNjMcUj4v8MtADx4Z3prg6MWyHCCWz9NJM', ALERT: 0.5, TOKENALERT: 1000,
    },
    {
      coin: 'KDA', label: 'SNAPSHOT', address: 'fluxsnapshotreward', ALERT: 0.001, TOKENALERT: 1000,
    },
    {
      coin: 'KDA', label: 'MINING', address: 'fluxcoinbasereward', ALERT: 0.001, TOKENALERT: 1000,
    },
    {
      coin: 'KDA', label: 'SWAP', address: 'fluxswap', ALERT: 0.001, TOKENALERT: 1000,
    },
    {
      coin: 'ALGO', label: 'SNAPSHOT', address: '2XAH2WI7726D5TGNXX7QBPL54PRMT4JUJZCXSAUWBJIBKC455AJ5RPEGAQ', ALERT: 25, TOKENALERT: 1000,
    },
    {
      coin: 'ALGO', label: 'MINING', address: 'RNZZK5ZCVMOYE64EAHCABG6YRXN35SKVAW5EXKJLPZZLAIXC5NCACU22HI', ALERT: 25, TOKENALERT: 1000,
    },
    {
      coin: 'ALGO', label: 'SWAP', address: '5MG5DOGNHGGG44HO7B4JXEORSFFLBNHFNTLYYR6OW53RNNCJK2LVSJVNXA', ALERT: 25, TOKENALERT: 1000,
    },
    {
      coin: 'MATIC', label: 'SNAPSHOT', address: '0x25adf2050244c087fc1a27b870844ab9c1936bdf', ALERT: 2, TOKENALERT: 1000,
    },
    {
      coin: 'MATIC', label: 'MINING', address: '0x208ef66cd865cc9dc862baf2be796a055d973d33', ALERT: 2, TOKENALERT: 1000,
    },
    {
      coin: 'MATIC', label: 'SWAP', address: '0x438ad183665511d41be2c779942f6c7660710be2', ALERT: 2, TOKENALERT: 1000,
    },
  ],
};
