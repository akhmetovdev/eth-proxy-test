require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

const fastify = require('fastify')({
  logger: true,
  http2: true,
  https: {
    allowHTTP1: true,
    key: fs.readFileSync(path.join(__dirname, 'fastify.key')),
    cert: fs.readFileSync(path.join(__dirname, 'fastify.cert'))
  }
});

fastify.register(require('@fastify/cors'));
fastify.register(require('@fastify/compress'));

let latestBlock = undefined;
let port = parseInt(process.env.PORT) || 8545;
let web3WsUrl = process.env.WEB3_WS_URL;
let clientConfig = { maxReceivedFrameSize: 1e9, maxReceivedMessageSize: 1e9 };
let provider = new Web3.providers.WebsocketProvider(web3WsUrl, { clientConfig });
let web3 = new Web3(provider);

fastify.post('/', (request, reply) => {
  const { id } = request.body;

  reply.header('access-control-allow-headers', '*');
  reply.header('access-control-allow-methods', '*');
  reply.header('access-control-allow-origin', '*');
  reply.header('access-control-max-age', 86400);
  reply.header('vary', 'Origin');

  reply.send({ jsonrpc: '2.0', id, result: latestBlock });
});

web3.eth.getBlockNumber((err, blockNumber) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  web3.eth.getBlock(blockNumber, false, (err, block) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }

    saveBlock(block);
    fastify.log.info(`block = ${blockNumber}`);

    web3.eth.subscribe('newBlockHeaders', (err, blockHeader) => {
      if (err == null) {
        web3.eth.getBlock(blockHeader.number, false, (err, block) => {
          if (err == null) {
            saveBlock(block);
            fastify.log.info(`block = ${blockHeader.number}`);
          }
        });
      }
    });

    fastify.listen({ port, host: '0.0.0.0' }, err => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
    });
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
