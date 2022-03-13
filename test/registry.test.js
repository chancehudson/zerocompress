const { ethers } = require('hardhat')
const assert = require('assert')
const crypto = require('crypto')
const { signer, mcl } = require('@thehubbleproject/bls')

async function getDeployedContracts() {
  const Registry = await ethers.getContractFactory('AddressRegistry')
  const registry = await Registry.deploy()
  await registry.deployed()

  const BLSRegistry = await ethers.getContractFactory('BLSKeyRegistry')
  const blsRegistry = await BLSRegistry.deploy()
  await blsRegistry.deployed()

  return { registry, blsRegistry }
}

async function getBlsSigner() {
  const factory = await signer.BlsSignerFactory.new()
  const domain = await new Promise((rs, rj) =>
    crypto.randomBytes(32, (err, bytes) => (err ? rj(err) : rs(bytes)))
  )
  const domainHex = Buffer.from(domain, 'hex')
  // secret data
  const rand = await new Promise((rs, rj) =>
    crypto.randomBytes(50, (err, bytes) => (err ? rj(err) : rs(bytes)))
  )
  return factory.getSigner(domainHex, `0x${rand.toString('hex')}`)
}

describe('bls key registry', () => {
  it('should register a bls pubkey', async () => {
    const { blsRegistry } = await getDeployedContracts()
    const _signer = await getBlsSigner()
    await blsRegistry.bindPubkey(_signer.pubkey).then(t => t.wait())
  })

  it('should fail to double register a pubkey', async () => {
    const { blsRegistry } = await getDeployedContracts()
    const _signer = await getBlsSigner()
    await blsRegistry.bindPubkey(_signer.pubkey).then(t => t.wait())
    try {
      await blsRegistry.bindPubkey(_signer.pubkey, {
        gasLimit: 200000
      }).then(t => t.wait())
      assert(false)
    } catch (err) {
      const { chainId } = await ethers.provider.getNetwork()
      if (chainId === 31337)
        assert(err.toString().indexOf(`reverted with reason string 'dupe'`) !== -1)
    }
  })

  it('should fail to register a pubkey with too many 0s', async () => {
    const { blsRegistry } = await getDeployedContracts()
    const _signer = await getBlsSigner()
    try {
      await blsRegistry.bindPubkey([
        _signer.pubkey[0],
        '0000000000000000000000000000000000000000000000000000000000000000',
        '0000000000000000000000000000000000000000000000000111111111111111',
        _signer.pubkey[3],
      ], {
        gasLimit: 200000
      }).then(t => t.wait())
      assert(false)
    } catch (err) {
      const { chainId } = await ethers.provider.getNetwork()
      if (chainId === 31337)
        assert(err.toString().indexOf(`reverted with reason string 'nosav'`) !== -1)
    }
  })
})

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
