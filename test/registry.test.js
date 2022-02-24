const { ethers } = require('hardhat')
const assert = require('assert')

async function getDeployedContracts() {
  const Registry = await ethers.getContractFactory('AddressRegistry')
  const registry = await Registry.deploy()
  await registry.deployed()

  return { registry }
}

describe('address registry', () => {
  it('should register an address', async () => {
    const { registry } = await getDeployedContracts()
    const address = '0x0102030405060708090a0b0c0d0e0fffffffffff'
    await registry.bindAddress(address).then(t => t.wait())
  })

  it('should fail to double register an address', async () => {
    const { registry } = await getDeployedContracts()
    const address = '0x0102030405060708090a0b0c0d0e0fffffffffff'
    await registry.bindAddress(address).then(t => t.wait())
    try {
      await registry.bindAddress(address, {
        gasLimit: 200000,
      }).then(t => t.wait())
      assert(false)
    } catch (err) {
      const { chainId } = await ethers.provider.getNetwork()
      if (chainId === 31337)
        assert(err.toString().indexOf(`reverted with reason string 'dupe'`) !== -1)
    }
  })

  it('should fail to register an address with too many 0s', async () => {
    const { registry } = await getDeployedContracts()
    const address = '0x00000000000000000000000000000000ffffffff'
    try {
      await registry.bindAddress(address, {
        gasLimit: 200000,
      }).then(t => t.wait())
      assert(false)
    } catch (err) {
      const { chainId } = await ethers.provider.getNetwork()
      if (chainId === 31337)
        assert(err.toString().indexOf(`reverted with reason string 'nosav'`) !== -1)
    }
  })
})
