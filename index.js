require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Web3 = require('web3');

let app = express();
let blockHeight = undefined;
let port = parseInt(process.env.PORT) || 8545;
let web3WsUrl = process.env.WEB3_WS_URL;
let clientConfig = { maxReceivedFrameSize: 1e9, maxReceivedMessageSize: 1e9 };
let provider = new Web3.providers.WebsocketProvider(web3WsUrl, { clientConfig });
let web3 = new Web3(provider);

app.use(cors());
app.use(bodyParser.json());

app.use((req, res) => {
  const { id } = req.body;

  res.json({ jsonrpc: '2.0', id, result: blockHeight });
});

web3.eth.getBlockNumber((err, blockNumber) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`block = ${blockNumber}`);

  blockHeight = '0x' + blockNumber.toString(16);

  web3.eth.subscribe('newBlockHeaders', (err, blockHeader) => {
    if (err == null) {
      console.log(`block = ${blockHeader.number}`);

      blockHeight = '0x' + blockHeader.number.toString(16);
    }
  });

  app.listen(port, '0.0.0.0', () => console.log(`listening on port = ${port}`));
});
