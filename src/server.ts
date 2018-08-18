import express from 'express';
import bodyParser from 'body-parser';
import WebSocket from 'ws';

import {
  Blockchain,
  getGenesisBlock,
  generateNextBlock,
  getLatestBlock,
  addBlock,
  isValidChain,
} from './blockchain';

type MessageType = 'QUERY_LATEST' | 'QUERY_ALL' | 'RESPONSE_BLOCKCHAIN';
interface Message {
  type: MessageType;
  data?: string; // the result of JSON.stringfy(Blockchain[])
}

const sockets: WebSocket[] = [];
let blockchain = [getGenesisBlock()];


/* Http Server */

export const initHttpServer = (http_port: number): void => {
  const app = express();
  app.use(bodyParser.json());

  app.get('/blocks', (req, res) =>
    res.send(JSON.stringify(blockchain))
  );
  app.post('/mineBlock', (req, res) => {
    const newBlock = generateNextBlock(req.body.data, blockchain);
    blockchain = addBlock(newBlock, blockchain);
    broadcast(responseLatestMsg());
    console.log('block added: ' + JSON.stringify(newBlock));
    res.send();
  });
  app.get('/peers', (req, res) => {
    res.send(sockets.map((s: any) => s._socket.remoteAddress + ':' + s._socket.remotePort));
  });
  app.post('/addPeer', (req, res) => {
    connectToPeers([req.body.peer]);
    res.send();
  });
  
  app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
};


/* WebSocket Client */

export const connectToPeers = (newPeers: string[]): void => {
    newPeers.forEach((peer) => {
        const ws = new WebSocket(peer);
        ws.on('open', () => initConnection(ws));
        ws.on('error', () => {
            console.log('connection failed')
        });
    });
  };


/* WebSocket Server */

export const initP2PServer = (p2p_port: number): void => {
  const server = new WebSocket.Server({port: p2p_port});
  server.on('connection', ws => initConnection(ws));
  console.log('listening websocket p2p port on: ' + p2p_port);
};


/* WebSocket Handler */

const initConnection = (ws: WebSocket): void => {
  sockets.push(ws);
  initMessageHandler(ws);
  initErrorHandler(ws);
  write(ws, queryChainLengthMsg());
};

const initMessageHandler = (ws: WebSocket): void => {
  ws.on('message', (data: string) => {
      const message = JSON.parse(data) as Message;
      console.log('Received message' + JSON.stringify(message));
      switch (message.type) {
          case 'QUERY_LATEST':
              write(ws, responseLatestMsg());
              break;
          case 'QUERY_ALL':
              write(ws, responseChainMsg());
              break;
          case 'RESPONSE_BLOCKCHAIN':
              handleBlockchainResponse(message);
              break;
      }
  });
};

const initErrorHandler = (ws: WebSocket): void => {
  const closeConnection = (ws: WebSocket) => {
      console.log('connection failed to peer: ' + ws.url);
      sockets.splice(sockets.indexOf(ws), 1);
  };
  ws.on('close', () => closeConnection(ws));
  ws.on('error', () => closeConnection(ws));
};


/* Blockchain Operation */

const handleBlockchainResponse = (message: Message): void => {
  const receivedBlocks = (JSON.parse(message.data!) as Blockchain).sort((b1, b2) => b1.index - b2.index);
  const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
  const latestBlockHeld = getLatestBlock(blockchain);
  if (latestBlockReceived.index > latestBlockHeld.index) {
      console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
      if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
          console.log("We can append the received block to our chain");
          blockchain.push(latestBlockReceived);
          broadcast(responseLatestMsg());
      } else if (receivedBlocks.length === 1) {
          console.log("We have to query the chain from our peer");
          broadcast(queryAllMsg());
      } else {
          console.log("Received blockchain is longer than current blockchain");
          replaceChain(receivedBlocks);
      }
  } else {
      console.log('received blockchain is not longer than current blockchain. Do nothing');
  }
};

const replaceChain = (newBlocks: Blockchain): void => {
  if (isValidChain(newBlocks) && newBlocks.length > blockchain.length) {
      console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
      blockchain = newBlocks;
      broadcast(responseLatestMsg());
  } else {
      console.log('Received blockchain invalid');
  }
};


/* Message Creation */

const queryChainLengthMsg = (): Message => ({
  type: 'QUERY_LATEST',
});
const queryAllMsg = (): Message => ({
  type: 'QUERY_ALL',
});
const responseChainMsg = (): Message =>({
  type: 'RESPONSE_BLOCKCHAIN',
  data: JSON.stringify(blockchain),
});
const responseLatestMsg = (): Message => ({
  type: 'RESPONSE_BLOCKCHAIN',
  data: JSON.stringify([getLatestBlock(blockchain)]),
});

const write = (ws: WebSocket, message: Message): void => ws.send(JSON.stringify(message));
const broadcast = (message: Message): void => sockets.forEach(socket => write(socket, message));
