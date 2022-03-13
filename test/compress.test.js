const { ethers } = require('hardhat')
const assert = require('assert')
const { compress } = require('../src')
const crypto = require('crypto')
const { signer, mcl } = require('@thehubbleproject/bls')

const _decompress = ethers.getContractFactory('DecompressTest')
  .then(f => f.deploy())
  .then(async c => {
    await c.deployed()
    return c
  })

async function getDeployedContracts() {
  const decompress = await _decompress

  const Test = await ethers.getContractFactory('Test')
  const test = await Test.deploy()
  await test.deployed()

  return { decompress, test }
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

describe('decompressor', () => {
  it('should compress bls pubkey', async () => {
    const [ user ] = await ethers.getSigners()
    const { test, decompress } = await getDeployedContracts()
    const _signer = await getBlsSigner()
    await decompress.connect(user).bindPubkey(_signer.pubkey).then(t => t.wait())
    const id = await decompress.idByPubkey(_signer.pubkey)
    const hash = ethers.utils.keccak256(ethers.utils.solidityPack(['uint[4]'], [_signer.pubkey]))
    await test.testMethod4(_signer.pubkey, hash).then(t => t.wait())
    {
      const [func, data] = compress(
        test.interface.encodeFunctionData('testMethod4', [_signer.pubkey, hash]),
        {
          blsPubkeySubs: [
            [_signer.pubkey, id],
          ]
        }
      )
      const tx = await test[func](data)
      await tx.wait()
    }
  })

  it('should fail to decompress bad pubkey id', async () => {
    const [ user ] = await ethers.getSigners()
    const { test, decompress } = await getDeployedContracts()
    const _signer = await getBlsSigner()
    const id = 1000000
    const hash = ethers.utils.keccak256(ethers.utils.solidityPack(['uint[4]'], [_signer.pubkey]))
    await test.testMethod4(_signer.pubkey, hash).then(t => t.wait())
    try {
      const [func, data] = compress(
        test.interface.encodeFunctionData('testMethod4', [_signer.pubkey, hash]),
        {
          blsPubkeySubs: [
            [_signer.pubkey, id],
          ]
        }
      )
      const tx = await test[func](data)
      await tx.wait()
    } catch (err) {
      const { chainId } = await ethers.provider.getNetwork()
      if (chainId === 31337)
        assert(err.toString().indexOf(`reverted with reason string 'pubkey not set'`) !== -1)
    }
  })

  it('should compress address', async () => {
    const [ user ] = await ethers.getSigners()
    const { test, decompress } = await getDeployedContracts()
    await decompress.connect(user).bindAddress(user.address).then(t => t.wait())
    const id = await decompress.idByAddress(user.address)
    const hash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [user.address]))
    await test.testMethod3(user.address, hash).then(t => t.wait())
    {
      const [func, data] = compress(
        test.interface.encodeFunctionData('testMethod3', [user.address, hash]),
        {
          addressSubs: {
            [user.address]: id
          }
        }
      )
      const tx = await test[func](data)
      await tx.wait()
    }
  })

  it('should fail to decompress bad address id', async () => {
    const [ user ] = await ethers.getSigners()
    const { test, decompress } = await getDeployedContracts()
    const id = 1000000
    const hash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [user.address]))
    await test.testMethod3(user.address, hash).then(t => t.wait())
    try {
      const [func, data] = compress(
        test.interface.encodeFunctionData('testMethod3', [user.address, hash]),
        {
          addressSubs: {
            [user.address]: id
          }
        }
      )
      const tx = await test[func](data)
      await tx.wait()
      assert(false)
    } catch (err) {
      const { chainId } = await ethers.provider.getNetwork()
      if (chainId === 31337)
        assert(err.toString().indexOf(`reverted with reason string 'address not set'`) !== -1)
    }
  })

  it('should compress variable size address ids', async () => {
    const [ user ] = await ethers.getSigners()
    const { test, decompress } = await getDeployedContracts()
    const ids = [
      Math.floor(Math.random() * 2 ** 8),
      2**8 + Math.floor(Math.random() * 2 ** 8),
      2**16 + Math.floor(Math.random() * 2 ** 16),
      2**24 + Math.floor(Math.random() * 2 ** 24),
      2**32 + Math.floor(Math.random() * 2 ** 32),
      2**40 - 50
    ]
    for (const id of ids) {
      await decompress
        .connect(user)
        .bindAddressExact(user.address, id)
        .then(t => t.wait())
    }
    const hash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [user.address]))
    await test.testMethod3(user.address, hash).then(t => t.wait())
    for (const id of ids) {
      const [func, data] = compress(
        test.interface.encodeFunctionData('testMethod3', [user.address, hash]),
        {
          addressSubs: {
            [user.address]: id
          }
        }
      )
      const tx = await test[func](data)
      await tx.wait()
    }
  })

  it('should insert 0xff bytes', async () => {
    const { test, decompress } = await getDeployedContracts()
    const bytes = '0xffffffffff00000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
    const hash = ethers.utils.keccak256(bytes)
    {
      const [func, data] = compress(
        test.interface.encodeFunctionData('testMethod2', [bytes, hash])
      )
      const tx = await test[func](data)
      await tx.wait()
    }
    {
      const tx = await test.testMethod2(bytes, hash)
      await tx.wait()
    }
  })

  it('should single compress and call a function', async () => {
    const { test, decompress } = await getDeployedContracts()
    const v1 = 150
    const v2 = 150
    const eq = true
    {
      const [func, data] = compress(
        test.interface.encodeFunctionData('testMethod1', [v1, v2, eq])
      )
      const tx = await test[func](data)
      await tx.wait()
    }
    {
      const tx = await test.testMethod1(v1, v2, eq)
      await tx.wait()
    }
    const bytes = '0x000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
    const hash = ethers.utils.keccak256(bytes)
    {
      const [func, data] = compress(
        test.interface.encodeFunctionData('testMethod2', [bytes, hash])
      )
      const tx = await test[func](data)
      await tx.wait()
    }
    {
      const tx = await test.testMethod2(bytes, hash)
      await tx.wait()
    }
  })

  it('should compress sequential length data', async () => {
    const { test } = await getDeployedContracts()
    const bytes = ['0x']
    for (let x = 0; x < 1030; x++) {
      bytes.push(Math.random() < 0.5 ? '01' : '00')
      const byteString = bytes.join('')
      if (x > 50 && x < 1020) continue
      const hash = ethers.utils.keccak256(byteString)
      const [func, data] = compress(
        test.interface.encodeFunctionData('testMethod2', [byteString, hash])
      )
      const tx = await test[func](data)
      await tx.wait()
    }
  })

  it('should recursively compress and call function', async () => {
    const { test } = await getDeployedContracts()
    const v1 = 150
    const v2 = 150
    const eq = true
    {
      const calldata1 = test.interface.encodeFunctionData('testMethod1', [ v1, v2, eq ])
      const [func1, data1] = compress(calldata1)
      const calldata2 = test.interface.encodeFunctionData(func1, [data1])
      const [func2, data2] = compress(calldata2)
      const tx = await test[func2](data2)
      await tx.wait()
    }
    {
      const tx = await test.testMethod1(v1, v2, eq)
      await tx.wait()
    }
    const bytes = '0x000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
    const hash = ethers.utils.keccak256(bytes)
    {
      const calldata1 = test.interface.encodeFunctionData('testMethod2', [ bytes, hash ])
      const [func1, data1] = compress(calldata1)
      const calldata2 = test.interface.encodeFunctionData(func1, [data1])
      const [func2, data2] = compress(calldata2)
      const tx = await test[func2](data2)
      await tx.wait()
    }
    {
      const tx = await test.testMethod2(bytes, hash)
      await tx.wait()
    }
  })

  it('should compress large data into bytes array', async () => {
    const charset = 'abcdef0123456789'
    // Make the calldata large enough that it can't use one of the fixed length
    // functions e.g. decompress(bytes32[5])
    const hexData = '0x' + Array(2048)
      .fill()
      .map(() => charset[Math.floor(Math.random() * 16)])
      .join('')
    const hash = ethers.utils.keccak256(hexData)
    const { test } = await getDeployedContracts()
    const calldata = test.interface.encodeFunctionData('testMethod2', [ hexData, hash ])
    {
      // single compress
      const [func, data] = compress(calldata)
      const tx = await test[func](data)
      await tx.wait()
    }
    await test.testMethod2(hexData, hash).then(t => t.wait())
  })
})
