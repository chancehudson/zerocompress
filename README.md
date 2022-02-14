# zerocompress

Compress Ethereum calldata then decompress on chain. For use in L2 applications.

## Strategy

Calldata in Ethereum is priced at 4 gas per zero byte, and 16 gas per non-zero byte. As a result data can only be efficiently compressed if either:

1. Zeroes are compressed to non-zeros with more than 75% efficiency
2. Zeroes are preserved in the compression

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

Implement the IDecompressReceiver protocol and register each receiver with the decompressor contract.

```js
import "zerocompress/contracts/interfaces/IDecompressReceiver.sol";

contract Example is IDecompressReceiver {
  function callMethod(uint8 method, bytes memory data) external override {
    if (method == uint8(0)) {
      // decode a struct for use
      MyStruct memory s = abi.decode(data, (MyStruct));
      // then do your business logic
      //
    } else if (method == uint8(1)) {
      // call this method instead
      //
    } else {
      // we don't know this method
      revert('unknown');
    }
  }
}
```

### JS

Compress the calldata for the target function using the ABI encoder. You can pass a full ABI spec, an array of types, or nothing to specify raw bytes.

```js
const { compressSingle, compressDouble } = require('zerocompress')

/**
 * Example with full format
 **/
const functionFormat = {
  type: 'tuple',
  components: [
    { name: 'counterparty', type: 'uint48' },
    {
      type: 'tuple[]',
      name: 'fixedParts',
      components: [
        { name: 'participants', type: 'uint48[]' },
        { name: 'nonce', type: 'uint48' },
      ],
    },
    { name: 'outcomeBytes', type: 'bytes[]' },
    { name: 'signature', type: 'uint[2]' },
  ],
}
const data = compressDouble(
  1, // contract index 1
  0, // method 0
  {
    counterparty,
    fixedParts,
    outcomeBytes,
    signature,
  },
  functionFormat
)
await Decompressor.decompressDoubleBitCall(data)


/**
 * Example with more simple abi format
 **/
const data = compressDouble(
  1, // contract index 1
  1, // method 1
  [ arg1, arg2, arg3 ],
  [ 'uint', 'uint', 'bytes32' ]
)
await Decompressor.decompressDoubleBitCall(data)
```
