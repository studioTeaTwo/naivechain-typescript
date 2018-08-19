import express from 'express';
import bodyParser from 'body-parser';

import {
  broadcast,
  responseLatestMsg,
  connectToPeers,
} from './p2p';
import {
  generateNextBlock,
  addBlock,
} from './blockchain';
import {
  getBlockchain,
  getSockets,
} from './store';


/* Web Server */

export const initWebServer = (http_port: number): void => {
  const app = express();
  app.use(bodyParser.json());

  app.get('/blocks', (req, res) => {
    const blockchain = getBlockchain();
    res.send(JSON.stringify(blockchain));
  });

  app.post('/mineBlock', (req, res) => {
    const blockchain = getBlockchain();
    const newBlock = generateNextBlock(req.body.data, blockchain);
    addBlock(newBlock, blockchain);
    broadcast(responseLatestMsg());
    console.log('block added: ' + JSON.stringify(newBlock));
    res.send();
  });

  app.get('/peers', (req, res) => {
    const sockets = getSockets();
    res.send(sockets.map((s: any) => s._socket.remoteAddress + ':' + s._socket.remotePort));
  });

  app.post('/addPeer', (req, res) => {
    connectToPeers([req.body.peer]);
    res.send();
  });

  app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
};
