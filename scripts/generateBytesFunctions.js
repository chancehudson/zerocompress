// both sides inclusive
const range = [1,32]

const allFunctions = []

for (let x = range[0]; x <= range[1]; x++) {
  allFunctions.push(
`  function decompress(bytes32[${x}] calldata) public {
    bytes memory b = new bytes(${x*32});
    assembly {
      calldatacopy(add(b, 32), 4, ${x*32})
    }
    decompressSingleBitCall(b);
  }`
  )
}

console.log(allFunctions.join('\n'))
