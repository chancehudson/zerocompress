# zerocompress [![CircleCI](https://img.shields.io/circleci/build/github/vimwitch/zerocompress)](https://app.circleci.com/pipelines/github/vimwitch/zerocompress?branch=main&filter=all)

Compress Ethereum calldata then decompress on chain. For use in L2 applications.

## Strategy

Calldata in Ethereum is priced at 4 gas per zero byte, and 16 gas per non-zero byte. As a result data can only be efficiently compressed if either:

1. Zeroes are compressed to non-zeros with more than 75% efficiency
2. Zeroes are not replaced with non-zeroes during compression

### Single bit

Data is compressed by looking at each byte and storing a single bit indicating whether the byte is zero or non-zero. If the byte is non-zero it is added to a "uniques" array of bytes.

**Each sequence of 8 consecutive zero bytes is compressed to a single zero byte.**

### Double bit

The double bit approach is similar to the single bit, but stores data in two bits. This allows 4 options to be stored.

- 0: a zero byte
- 1: a non-zero byte
- 2: custom sequence
- 3: custom sequence

Currently values 2 and 3 are used to insert a fixed number of zero bytes. This can be extended to store repeated strings of non-zero bytes (if they exist).

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
