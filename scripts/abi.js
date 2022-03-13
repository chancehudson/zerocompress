const path = require('path')
const fs = require('fs')

{
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
}

{
  const { abi } = require(
    path.join(
      __dirname,
      '../artifacts/contracts/BLSKeyRegistry.sol/BLSKeyRegistry.json'
    )
  )

  fs.writeFileSync(
    path.join(__dirname, '../src/BLSKeyRegistryABI.json'),
    JSON.stringify(abi)
  )
}
