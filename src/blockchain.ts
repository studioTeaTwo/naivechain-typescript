import CryptoJS from 'crypto-js';


/* Blockchain Difiniton */

type Block = {
  index: number;
  previousHash: string;
  timestamp: number;
  data: string;
  hash: string;
}

export type Blockchain = Block[];


/* Blockchain Operation */

export function getGenesisBlock(): Block {
  return createBlock(
    0,
    "0", 
    1465154705,
    "my genesis block!!",
    "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7",
  );
}

export function getLatestBlock(blockchain: Blockchain): Block {
  return blockchain[blockchain.length - 1];
}

export function generateNextBlock(blockData: string, blockchain: Blockchain): Block {
  const previousBlock = getLatestBlock(blockchain);
  const nextIndex = previousBlock.index + 1;
  const nextTimestamp = ~~(Date.now() / 1000);
  const nextHash = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
  return createBlock(
    nextIndex,
    previousBlock.hash,
    nextTimestamp,
    blockData,
    nextHash,
  );
}

export function addBlock(newBlock: Block, blockchain: Blockchain): Blockchain {
  if (isValidNewBlock(newBlock, getLatestBlock(blockchain))) {
    return blockchain.concat([newBlock]);
  }
  return blockchain;
};

export function isValidChain(blockchainToValidate: Blockchain): boolean {
  if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(getGenesisBlock())) {
      return false;
  }
  const tempBlocks = [blockchainToValidate[0]];
  for (let i = 1; i < blockchainToValidate.length; i++) {
      if (isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
          tempBlocks.push(blockchainToValidate[i]);
      } else {
          return false;
      }
  }
  return true;
};


function createBlock(
  index: number,
  previousHash: string,
  timestamp: number,
  data: any,
  hash: string
): Block {
  return {
    index,
    previousHash,
    timestamp,
    data,
    hash
  }
}

function calculateHashForBlock(block: Block): string {
  return calculateHash(
    block.index,
    block.previousHash,
    block.timestamp,
    block.data,
  );
};

function calculateHash(index: number, previousHash: string, timestamp: number, data: string): string {
  return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
};

function isValidNewBlock(newBlock: Block, previousBlock: Block): boolean {
  if (previousBlock.index + 1 !== newBlock.index) {
      console.log('invalid index');
      return false;
  } else if (previousBlock.hash !== newBlock.previousHash) {
      console.log('invalid previoushash');
      return false;
  } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
      console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
      console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
      return false;
  }
  return true;
};
