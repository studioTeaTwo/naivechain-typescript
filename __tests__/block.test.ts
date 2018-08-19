import * as Blockchain from '../src/blockchain';

test('get GenesisBlock', () => {
  expect(Blockchain.getGenesisBlock()).toEqual({
    index: 0,
    previousHash: "0", 
    timestamp: 1465154705,
    data: "my genesis block!!",
    hash: "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7",
  });
});