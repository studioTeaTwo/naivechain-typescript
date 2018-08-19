import WebSocket from 'ws';

import { Block, getGenesisBlock } from './blockchain';

/* Mutable Data */

let sockets: WebSocket[] = [];
let blockchain = [getGenesisBlock()];

/* Accessor */

export function getSockets(): WebSocket[] {
  return sockets;
}

export function getBlockchain(): Block[] {
  return blockchain;
}

export function replaceBlockchain(newBlockchain: Block[]): void {
  blockchain = newBlockchain;
}
