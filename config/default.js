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
    BASE: 'https://basescan.org/address/',
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
    BASE: '0xb008bdcf9cdff9da684a190941dc3dca8c2cdd44',
  },
  fetchDelay: 50, // in case of missing api key
  bscApiKey: 'ATB3N4CY9HBH4YNUK71H7AXSB7KACSR7Q5',
  ethApiKey: 'KTIM6I4VUA2KP94ICCEMZR7VD4TRURZ3UU',
  solApiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3MDIzODQ2NzAzMjEsImVtYWlsIjoidGFkZWFzQHJ1bm9uZmx1eC5pbyIsImFjdGlvbiI6InRva2VuLWFwaSIsImlhdCI6MTcwMjM4NDY3MH0.dvwAapchZoBBWpmeM3UnU2JH1PC78lqwqI9J5JCqNCc',
  maticApiKey: '7BAK281G85JQ91766GQQ8GFB17MGKW6NM9',
  avaxApiKey: '',
  discordHook: '',
  kdaApi: '',
  kdaTokenApi: '',
  baseApiKey: '4NWEV3ZKFW4TIC93Q1J9R3KUNSHTDY9H9D',
  addresses: [
    {
      coin: 'FLUX', label: 'MINING', address: 't1Yum7okNzR5kW84dfgwqB23yy1BCcpHFPq', ALERT: 50000,
    },
    {
      coin: 'FLUX', label: 'SWAP', address: 't1abAp9oZenibGLFuZKyUjmL6FiATTaCYaj', ALERT: 100000,
    },
    {
      coin: 'FLUX', label: 'COLD', address: 't1cjcLaDHkNcuXh6uoyNL7u1jx7GxvzfYAN', ALERT: 1000000,
    },
    {
      coin: 'FLUX', label: 'LOCKED', address: 't3ThbWogDoAjGuS6DEnmN1GWJBRbVjSUK4T', ALERT: 160000000,
    },
    {
      coin: 'SOL', label: 'SNAPSHOT', address: '94W7UnJTBNEQSAk854NLTBgbqzSqHQNyFtQYPiGzNFaA', ALERT: 0.001, TOKENALERT: 10000,
    },
    {
      coin: 'SOL', label: 'MINING', address: '9dfk2Rq1MnuvjQvTsBkWvncpvQsuR8vrioFzkFG7HKvW', ALERT: 0.001, TOKENALERT: 10000,
    },
    {
      coin: 'SOL', label: 'SWAP', address: 'CCafnH2sUhPHitQWyFLDCe3Xqwz1Vrc2caNR6PAwkPzP', ALERT: 0.001, TOKENALERT: 10000,
    },
    {
      coin: 'SOL', label: 'LOCKED', address: '98duys57BNeYNdA4JPYzkraXe1XoUYXq5MMesx1JLsFY', ALERT: 0.001, TOKENALERT: 45000000,
    },
    {
      coin: 'SOL', label: 'LOCKED SNAPSHOT', address: 'CTUGomZr8KKQP4k8RrhrNdncMsd8zaCfuTRtAV6Fd71G', ALERT: 0, TOKENALERT: 1400000,
    },
    {
      coin: 'SOL', label: 'LOCKED MINING', address: '97BNByqDVXvyRPheDskRFTHKQcs56PXpdrzD9RcQwXw2', ALERT: 0, TOKENALERT: 3500000,
    },
    {
      coin: 'BSC', label: 'SNAPSHOT', address: '0x4004755e538b77f80004b0f9b7f7df4e9793e584', ALERT: 0.01, TOKENALERT: 10000,
    },
    {
      coin: 'BSC', label: 'MINING', address: '0x8cb191750096ddc8f314c2de6ef28331503774e9', ALERT: 0.01, TOKENALERT: 10000,
    },
    {
      coin: 'BSC', label: 'SWAP', address: '0x9b192227da99b5a50d037b10c965609ed83c43d7', ALERT: 0.01, TOKENALERT: 100000,
    },
    {
      coin: 'BSC', label: 'LOCKED', address: '0x5b79692e093c70e47070f525b593cc35b5adf530', ALERT: 0, TOKENALERT: 350000000,
    },
    {
      coin: 'BSC', label: 'LOCKED SNAPSHOT', address: '0x1e1f3d2517c97295f68836f154f531049a9b133a', ALERT: 0, TOKENALERT: 1100000,
    },
    {
      coin: 'BSC', label: 'LOCKED MINING', address: '0xbfb2181c9480f911e288fa14b5d71f9db9795bf3', ALERT: 0, TOKENALERT: 3500000,
    },
    {
      coin: 'ETH', label: 'SNAPSHOT', address: '0x5a2387883bc5e875e09d533eef812b2da30f2615', ALERT: 0.1, TOKENALERT: 10000,
    },
    {
      coin: 'ETH', label: 'MINING', address: '0x342c34702929849b6deaa47496d211cbe4167fa5', ALERT: 0.1, TOKENALERT: 10000,
    },
    {
      coin: 'ETH', label: 'SWAP', address: '0x134e4c74c670adefdcb2476df6960d9297bc7dad', ALERT: 0.1, TOKENALERT: 100000,
    },
    {
      coin: 'ETH', label: 'LOCKED', address: '0xa23702e9349fbf9939864da1245f5b358e7ef30b', ALERT: 0, TOKENALERT: 300000000,
    },
    {
      coin: 'ETH', label: 'LOCKED SNAPSHOT', address: '0x5a2e9f076ba06bae75d2bb6586139b95055ceeb4', ALERT: 0, TOKENALERT: 1300000,
    },
    {
      coin: 'ETH', label: 'LOCKED MINING', address: '0x1b9f4e3805119de9615d821ebfd83ac57cfb10ce', ALERT: 0, TOKENALERT: 3500000,
    },
    {
      coin: 'TRON', label: 'SNAPSHOT', address: 'TSHXNnsrKGf6KAfosq5mckCnaY7gUfGwBJ', ALERT: 100, TOKENALERT: 10000,
    },
    {
      coin: 'TRON', label: 'MINING', address: 'TVkT9g2zzgcztm81RozqBA1UbwzZpoN8cM', ALERT: 100, TOKENALERT: 10000,
    },
    {
      coin: 'TRON', label: 'SWAP', address: 'TA7U2PTnHDyhHBns3X6NsDndjZDBUE3oUa', ALERT: 100, TOKENALERT: 10000,
    },
    {
      coin: 'TRON', label: 'LOCKED', address: 'THV8NGvAwyaL22kkhkXHVhL7JBDyxRs3BZ', ALERT: 0, TOKENALERT: 350000000,
    },
    {
      coin: 'TRON', label: 'LOCKED SNAPSHOT', address: 'TNSgkA1VqiZ4KDJrVKGoy2f9TgGoNjDFWC', ALERT: 0, TOKENALERT: 1300000,
    },
    {
      coin: 'TRON', label: 'LOCKED MINING', address: 'TGwJYVkJGEnS5mWP1SE9zaiXMQ7frCzitj', ALERT: 0, TOKENALERT: 3500000,
    },
    {
      coin: 'AVAX', label: 'SNAPSHOT', address: '0x1F3b258e0ff097FC4E25B827401D10fDeAa71fC5', ALERT: 1, TOKENALERT: 10000,
    },
    {
      coin: 'AVAX', label: 'MINING', address: '0x8967d37E297f6f6ede242d51783917eb07fDE293', ALERT: 1, TOKENALERT: 10000,
    },
    {
      coin: 'AVAX', label: 'SWAP', address: '0xe0d28bc942B7B0b9A513F92a2fCef2bdF0377619', ALERT: 1, TOKENALERT: 10000,
    },
    {
      coin: 'AVAX', label: 'LOCKED', address: '0xBdB587D89929b3188325643800f8f789Bf72FF53', ALERT: 0, TOKENALERT: 350000000,
    },
    {
      coin: 'AVAX', label: 'LOCKED SNAPSHOT', address: '0x2599C465F0290237954E04550dA8cf8c94644e29', ALERT: 0, TOKENALERT: 1500000,
    },
    {
      coin: 'AVAX', label: 'LOCKED MINING', address: '0xc926CbFCbF9313E6530e3342Ee1556ce5D2c0da9', ALERT: 0, TOKENALERT: 4000000,
    },
    {
      coin: 'ERGO', label: 'SNAPSHOT', address: '9hhRnDa1Hih5TepwqK1Zbb8SGYUbFpqTwE9G78yffudKq59xTa9', ALERT: 0, TOKENALERT: 10000,
    },
    {
      coin: 'ERGO', label: 'MINING', address: '9hZ9ygGKcQ9z1oaYQEmNF53aiNQTazhBo9DFC8tQsR47a15ueGw', ALERT: 2, TOKENALERT: 10000,
    },
    {
      coin: 'ERGO', label: 'SWAP', address: '9fCKJ7g6ZffHAQb9UQY7S6YLF6dRVejBAXw284XNazkq8XLuZbw', ALERT: 2, TOKENALERT: 10000,
    },
    {
      coin: 'ERGO', label: 'LOCKED', address: '9gtdyNTVfziFsGzH7KNjMcUj4v8MtADx4Z3prg6MWyHCCWz9NJM', ALERT: 0.5, TOKENALERT: 350000000,
    },
    {
      coin: 'ERGO', label: 'LOCKED SNAPSHOT', address: '9i24aAG4uG6NrPSqdWRk9PHzyxk472289F5o19KZMfXsdcbvXQf', ALERT: 0, TOKENALERT: 1700000,
    },
    {
      coin: 'ERGO', label: 'LOCKED MINING', address: '9hfswHWqDMd2pLDRFCfxQWDTEjNwfsNSw6tweedZwuBe8z92ZyV', ALERT: 0, TOKENALERT: 4000000,
    },
    {
      coin: 'KDA', label: 'SNAPSHOT', address: 'fluxsnapshotreward', ALERT: 0.001, TOKENALERT: 10000,
    },
    {
      coin: 'KDA', label: 'MINING', address: 'fluxcoinbasereward', ALERT: 0.001, TOKENALERT: 10000,
    },
    {
      coin: 'KDA', label: 'SWAP', address: 'fluxswap', ALERT: 0.001, TOKENALERT: 10000,
    },
    {
      coin: 'KDA', label: 'LOCKED', address: 'k:869daee30836deb4beb5fefcffb53bcb92d44514670bc721c073065b5832dbfb', ALERT: 0.001, TOKENALERT: 30000000,
    },
    {
      coin: 'KDA', label: 'LOCKED SNAPSHOT', address: 'k:e7f86a71fd26282cc7818f034ed7ab169effef724e06b31632b7be0f808c5b6e', ALERT: 0, TOKENALERT: 1700000,
    },
    {
      coin: 'KDA', label: 'LOCKED MINING', address: 'k:52638422aa11e81e1098da69a0cb3bbcb676294efa3d000a7bec80e8e946d0b1', ALERT: 0, TOKENALERT: 3500000,
    },
    {
      coin: 'ALGO', label: 'SNAPSHOT', address: '2XAH2WI7726D5TGNXX7QBPL54PRMT4JUJZCXSAUWBJIBKC455AJ5RPEGAQ', ALERT: 25, TOKENALERT: 10000,
    },
    {
      coin: 'ALGO', label: 'MINING', address: 'RNZZK5ZCVMOYE64EAHCABG6YRXN35SKVAW5EXKJLPZZLAIXC5NCACU22HI', ALERT: 25, TOKENALERT: 10000,
    },
    {
      coin: 'ALGO', label: 'SWAP', address: '5MG5DOGNHGGG44HO7B4JXEORSFFLBNHFNTLYYR6OW53RNNCJK2LVSJVNXA', ALERT: 25, TOKENALERT: 10000,
    },
    {
      coin: 'ALGO', label: 'LOCKED', address: 'X6H5CRS2TLI4M3B4BNVW3DKC6RER7ZGOLJBGDMCUFI5NKJCT4BBSUCXRW4', ALERT: 5, TOKENALERT: 350000000,
    },
    {
      coin: 'ALGO', label: 'LOCKED SNAPSHOT', address: 'V7P7W2MIGGYLYR2VFX6HH74WEA6DWP4JVJMR5RMC2T6HGEB3K4WZ6DDSCE', ALERT: 0, TOKENALERT: 2000000,
    },
    {
      coin: 'ALGO', label: 'LOCKED MINING', address: '6X2Q7AF53ESJZ7DJBEUSEGTXVRQLS6FTIZSAHKL725W6SXJOIZUNKM4IHQ', ALERT: 0, TOKENALERT: 4000000,
    },
    {
      coin: 'MATIC', label: 'SNAPSHOT', address: '0x25adf2050244c087fc1a27b870844ab9c1936bdf', ALERT: 2, TOKENALERT: 10000,
    },
    {
      coin: 'MATIC', label: 'MINING', address: '0x208ef66cd865cc9dc862baf2be796a055d973d33', ALERT: 2, TOKENALERT: 10000,
    },
    {
      coin: 'MATIC', label: 'SWAP', address: '0x438ad183665511d41be2c779942f6c7660710be2', ALERT: 2, TOKENALERT: 10000,
    },
    {
      coin: 'MATIC', label: 'LOCKED', address: '0xee38530d735d485558c454268ffefe7704cc25c0', ALERT: 2, TOKENALERT: 350000000,
    },
    {
      coin: 'MATIC', label: 'LOCKED SNAPSHOT', address: '0xc7b7076ca1d7971c2e27b7c4f6493d8140c2fdd0', ALERT: 0, TOKENALERT: 2000000,
    },
    {
      coin: 'MATIC', label: 'LOCKED MINING', address: '0xd6bd199e94a9ac4dc73ce4dd4c0c02c82d6cf6c2', ALERT: 0, TOKENALERT: 4000000,
    },
    {
      coin: 'BASE', label: 'SNAPSHOT', address: '0xdcc46899f137e7eb82437b230898dabaf3d73046', ALERT: 0.005, TOKENALERT: 10000,
    },
    {
      coin: 'BASE', label: 'MINING', address: '0xe91b74d3c716ce77179384916f3c1700942226cc', ALERT: 0.005, TOKENALERT: 10000,
    },
    {
      coin: 'BASE', label: 'SWAP', address: '0x98f17e2d8c09f637a236d067191e0d11656a7df0', ALERT: 0.005, TOKENALERT: 10000,
    },
    {
      coin: 'BASE', label: 'LOCKED', address: '0x7f5f9cd4c4c67c3f80ed74e0e1fb9e3d7975a479', ALERT: 0.001, TOKENALERT: 350000000,
    },
    {
      coin: 'BASE', label: 'LOCKED SNAPSHOT', address: '0xe05fb97b601fb036bc7b75fcb1c8027193213af5', ALERT: 0, TOKENALERT: 3000000,
    },
    {
      coin: 'BASE', label: 'LOCKED MINING', address: '0xd86292b7e8d3ca5ddc474feaf46455bfa55ae36b', ALERT: 0, TOKENALERT: 4000000,
    },
  ],
};
