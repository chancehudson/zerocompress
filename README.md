# zerocompress [![CircleCI](https://img.shields.io/circleci/build/github/vimwitch/zerocompress)](https://app.circleci.com/pipelines/github/vimwitch/zerocompress?branch=main&filter=all)

Compress Ethereum calldata then decompress on chain. For use in L2 applications.

## Strategy

Calldata in Ethereum is priced at 4 gas per zero byte, and 16 gas per non-zero byte. As a result data can only be efficiently compressed if either:

1. Zeroes are compressed to non-zeros with more than 75% efficiency
2. Zeroes are not replaced with non-zeroes during compression

### Zerocompress

There are 3 main structures in zerocompressed data:

1. A config section specifying default values and lengths of the following sections
2. A bits section storing a 1 for a non-zero byte and 0 for a zero byte
3. A section of non-zero bytes

This algorithm stores a 0 bit for each zero byte and a 1 bit for each non-zero byte in section 2. The non-zero byte is added to section 3 to be inserted during inflation. Inflation is done by iterating over each bit in section 2 and inserting either a zero byte or pulling and inserting the next non-zero byte from section 3.

Using this strategy there should never be a 1 bit pointing to a 0 byte. This fact is used to implement opcodes for decompression, which can be seen below.

### Opcodes

A zero value in section 3 indicates a special operation. The byte following a zero byte specifies the opcode for inflation. Any number of trailing bytes may be used as argument(s) for the opcode.

- [x] `0x00()` - zero insertion, insert a fixed number of zeroes specified by a number at register 1 (this number may be 0) (use this to make the total data length shorter to avoid padding)
- [x] `0x01-0xE0` - Fixed length 0 insertion
- [x] `0xE1-0xF1` - Fixed length `0xFF` insertion
- [x] `0xF2-0xF6 (uint40 id)` - address insertion
- [x] `0xF7-0xFB (uint40 id)` - bls pubkey insertion (uint[4])
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
const { compress } = require('zerocompress')

// deploy your contract that inherits Decompressor
const example = new ethers.Contract(
  '0xabcabcabc0abcabcabc0abcabcabc0abcabcabc0',
  ExampleABI
)

// Encode the function call
const calldata = example.interface.encodeFunctionData('testFunc', [ 20, 40 ])
// Compress the data and get a function to call and data to pass
const [ func, data ] = compress(calldata)
// Call the function with the data
const tx = await example[func](data)
// Wait for the transaction to complete
await tx.wait()
```

### `compress` API

`compress(calldata, options) returns [func, data]`

- `calldata`: A bytes string optionally prefixed with `0x`. Should be an 8 byte function selector followed by abi encoded arguments.
- `options`: An optional object specifying address and bls public key replacements.
  - `addressSubs`: An optional object mapping addresses to integers. Example: `{ '0xabcabcabc0abcabcabc0abcabcabc0abcabcabc0': 10029 }`
  - `blsPubkeySubs`: An array of arrays mapping bls public keys to integers. Each item should be an array of length 2 containing the bls key (as an array of hex strings) as the first element, and an integer as the second element. Example:

```
[
  [ // the first replacement element
    [
      '0x02387ea12d645f4a3af6f974de1732c5d2a4469ddd14b74068f3f9ab71a3adf2',
      '0x2fb47daa10b6066a152832ce5275297424ef3b778f9853510cea6a79ab07bf42',
      '0x26d1389521121b21d7f6ee981f35ff627944b3a6877ecdc194b7b9ed6c1ec112',
      '0x0f4c29d245098298838b2e66de53d1d10482bddada6b4fc0d4b5b814fa2d5b16'
    ],
    41294
  ],
  [ // the second replacement element
    [
      '0x02186699ca6e1174566611699dd295af60434d60b0478a621e933789cf6c9574',
      '0x2f43e276298f9ecfc4c3925155fe852b94cfd191410831b051663fabf99ec2ce',
      '0x11bf07ff3b44f6f4ec24effc81be892097e591af6591481c6d84a99d0ece2f17',
      '0x28a14cf5fb0e62f55cba5048c3c6cfe53ad8eda449e7528abf30484eb7efdc64'
    ],
    20939
  ]
]
```
  - `func`: (return value) A fully formed function selector to call on the target contract. Example: `decompress(bytes32[2])`
  - `data`: (return value) Data to pass to the returned function.

### Address Registry

To use address substitution each address must be registered with the `Decompress` contract. Registration will return an integer that can be substituted in compressed data.

```
const { decompressAddress, AddressRegistryABI } = require('zerocompress')
{
  const registry = new ethers.Contract(decompressAddress, AddressRegistryABI)
  await registry.bindAddress(myAddress).then(t => t.wait())
  const id = await registry.idByAddress(myAddress)
  // id is the address that can be used for compression now
  // e.g. compress(calldata, { addressSubs: { [myAddress]: id }})
}
```

### BLS Public Key Registry

To use BLS public key substitution each public key must be registered with the `Decompress` contract before use. Registration will return an integer that can be substituted in compressed data.

```
const { decompressAddress, BLSPubkeyRegistryABI } = require('zerocompress')
{
  const registry = new ethers.Contract(decompressAddress, BLSPubkeyRegistryABI)
  await registry.bindPubkey(myPubkey).then(t => t.wait())
  const id = await registry.idByPubkey(myPubkey)
  // id is the pubkey that can be used for compression now
  // e.g. compress(calldata, { blsPubkeySubs: [ [ myPubkey, id ] ]})
}
```

### Addresses

The `Decompress` contract (implementing the `AddressRegistry` and `BLSPubkeyRegistry`) is available on the following networks:

- Optimism Kovan: [0x75b6fA14947E6B524ECEf46a6A4A3c1D0E0b62dF](https://kovan-optimistic.etherscan.io/address/0x75b6fA14947E6B524ECEf46a6A4A3c1D0E0b62dF)
- Arbitrum Rinkeby: [0x75b6fA14947E6B524ECEf46a6A4A3c1D0E0b62dF](https://testnet.arbiscan.io/address/0x75b6fA14947E6B524ECEf46a6A4A3c1D0E0b62dF)
