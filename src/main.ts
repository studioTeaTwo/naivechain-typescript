import {
  initHttpServer,
  initP2PServer,
  connectToPeers,
} from './server';

declare const process: any;

const http_port: number = process.env.HTTP_PORT || 3001;
const p2p_port: number = process.env.P2P_PORT || 6001;
const initialPeers: string[] = process.env.PEERS ? process.env.PEERS.split(',') : [];

connectToPeers(initialPeers);
initHttpServer(http_port);
initP2PServer(p2p_port);
