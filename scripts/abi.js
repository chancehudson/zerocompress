const path = require('path')
const fs = require('fs')

const { abi } = require(
  path.join(
    __dirname,
    '../artifacts/contracts/AddressRegistry.sol/AddressRegistry.json'
  )
)

fs.writeFileSync(
  path.join(__dirname, '../src/AddressRegistryABI.json'),
  JSON.stringify(abi)
)
