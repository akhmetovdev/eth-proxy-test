require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Web3 = require('web3');

let app = express();
let latestBlock = undefined;
let port = parseInt(process.env.PORT) || 8545;
let web3WsUrl = process.env.WEB3_WS_URL;
let clientConfig = { maxReceivedFrameSize: 1e9, maxReceivedMessageSize: 1e9 };
let provider = new Web3.providers.WebsocketProvider(web3WsUrl, { clientConfig });
let web3 = new Web3(provider);

app.use(cors());
app.use(bodyParser.json());
app.set('x-powered-by', false);

app.use((req, res) => {
  const { id } = req.body;

  res.setHeader('access-control-allow-headers', '*');
  res.setHeader('access-control-allow-methods', '*');
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-max-age', 86400);
  res.setHeader('vary', 'Origin');
  res.setHeader('content-type', 'application/json');

  res.json({ jsonrpc: '2.0', id, result: latestBlock });
});

web3.eth.getBlockNumber((err, blockNumber) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  web3.eth.getBlock(blockNumber, false, (err, block) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    saveBlock(block);
    console.log(`block = ${blockNumber}`);

    web3.eth.subscribe('newBlockHeaders', (err, blockHeader) => {
      if (err == null) {
        web3.eth.getBlock(blockHeader.number, false, (err, block) => {
          if (err == null) {
            saveBlock(block);
            console.log(`block = ${blockHeader.number}`);
          }
        });
      }
    });

    app.listen(port, '0.0.0.0', () => console.log(`listening on port = ${port}`));
  });
});

function saveBlock(block) {
  latestBlock = {
    ...block,
    baseFeePerGas: intToHex(block.baseFeePerGas),
    difficulty: intToHex(block.difficulty),
    gasLimit: intToHex(block.gasLimit),
    gasUsed: intToHex(block.gasUsed),
    number: intToHex(block.number),
    size: intToHex(block.size),
    timestamp: intToHex(block.timestamp),
    totalDifficulty: intToHex(block.totalDifficulty)
  };
}

function intToHex(value) {
  return '0x' + parseInt(value).toString(16);
}
