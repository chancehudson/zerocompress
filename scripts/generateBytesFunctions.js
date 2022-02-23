// both sides inclusive
const range = [1,32]

const allFunctions = []

for (let x = range[0]; x <= range[1]; x++) {
  allFunctions.push(
`  function decompress(bytes32[${x}] calldata) public {
    bytes memory b = new bytes(${x*32 - 1});
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, ${x*32 - 1})
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }`
  )
}

console.log(allFunctions.join('\n'))
