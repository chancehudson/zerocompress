# zerocompress [![CircleCI](https://img.shields.io/circleci/build/github/vimwitch/zerocompress)](https://app.circleci.com/pipelines/github/vimwitch/zerocompress?branch=main&filter=all)

Compress Ethereum calldata then decompress on chain. For use in L2 applications.

## Strategy

Calldata in Ethereum is priced at 4 gas per zero byte, and 16 gas per non-zero byte. As a result data can only be efficiently compressed if either:

1. Zeroes are compressed to non-zeros with more than 75% efficiency
2. Zeroes are not replaced with non-zeroes during compression

### Single bit

Data is compressed by looking at each byte and storing a single bit indicating whether the byte is zero or non-zero. If the byte is non-zero it is added to a `uniques` array of bytes.

**Each sequence of 8 consecutive zero bytes is compressed to a single zero byte.**

### Opcodes

A zero value in the `uniques` array indicates a special operation. The byte following a zero byte in the `uniques` array specifies an opcode for inflation. Any number of following bytes may be used as an argument for the opcode.

- [x] `0x00()` - zero insertion, insert a fixed number of zeroes specified by a number at register 1 (this number may be 0) (use this to make the total data length shorter to avoid padding)
- [x] `0x01-0xE0` - Fixed length 0 insertion
- [x] `0xE1-0xF1` - Fixed length `0xFF` insertion
- [x] `0xF2-0xF6 (uint40 id)` - address insertion
- [x] `0xF7-0xFA(uint40 id)` - bls pubkey insertion (uint[4])
- [ ] `tbd(uint8 length)` - insert a repeat string of bytes specified at register 2
- [x] `0xFC-0xFF` - for external use

Registers are bytes at the end of the data.

## Use

`npm i zerocompress`

### Contract

Implement a contract inheriting from the `Decompressor` contract.

```js
import "zerocompress/contracts/Decompressor.sol";

contract Example is Decompressor {
  function testFunc(uint a, uint b) public {
    require(a != b);
  }
}
```

### JS

Encode the data for the target function call using Ethers or Web3. Then compress the data using `compressSingle` or `compressDouble`. These functions will return a function to call and data to pass.

```js
const { ethers } = require('ethers')
const { ExampleABI } = require('Example.sol.json')
const { compressSingle, compressDouble } = require('zerocompress')

const example = new ethers.Contract(
  '0xabcabcabc0abcabcabc0abcabcabc0abcabcabc0',
  ExampleABI
)

// Encode the function call
const calldata = example.interface.encodeFunctionData('testFunc', [ 20, 40 ])
// Compress the data and get a function to call and data to pass
const [ func, data ] = compressSingle(calldata)
// Call the function with the data
const tx = await example[func](data)
// Wait for the transaction to complete
await tx.wait()
```
