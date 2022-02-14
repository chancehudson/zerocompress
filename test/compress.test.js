const { ethers } = require('hardhat')
const assert = require('assert')
const { compressSingle, compressDouble } = require('../src')

async function getDeployedContracts() {
  const Decompressor = await ethers.getContractFactory('Decompressor')
  const decompressor = await Decompressor.deploy()
  await decompressor.deployed()

  const Test = await ethers.getContractFactory('Test')
  const test = await Test.deploy()
  await test.deployed()

  return { decompressor, test }
}

describe('decompressor', () => {
  it('should single compress and call a function', async () => {
    const { test, decompressor } = await getDeployedContracts()
    {
      const tx = await decompressor.registerReceiver(test.address);
      await tx.wait()
    }
    const receiverIndex = await decompressor.receiversByAddress(test.address)
    const v1 = 150
    const v2 = 150
    const eq = true
    {
      const data = compressDouble(receiverIndex, 1, [ v1, v2, eq ], ['uint', 'uint', 'bool'])
      const tx = await decompressor.decompressDoubleBitCall(data)
      await tx.wait()
    }
    {
      const tx = await test.testMethod1(v1, v2, eq)
      await tx.wait()
    }
    const bytes = '0x000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
    const hash = ethers.utils.keccak256(bytes)
    {
      const data = compressDouble(receiverIndex, 2, [ bytes, hash ], ['bytes', 'bytes32'])
      const tx = await decompressor.decompressDoubleBitCall(data)
      await tx.wait()
    }
    {
      const data = compressSingle(receiverIndex, 2, [ bytes, hash ], ['bytes', 'bytes32'])
      const tx = await decompressor.decompressSingleBitCall(data)
      await tx.wait()
    }
    {
      const tx = await test.testMethod2(bytes, hash)
      await tx.wait()
    }
  })

  it('should double compress and call function', async () => {
    const { test, decompressor } = await getDeployedContracts()
    {
      const tx = await decompressor.registerReceiver(test.address);
      await tx.wait()
    }
    const receiverIndex = await decompressor.receiversByAddress(test.address)
    const v1 = 150
    const v2 = 150
    const eq = true
    {
      const data = compressSingle(receiverIndex, 1, [ v1, v2, eq ], ['uint', 'uint', 'bool'])
      const _data = compressSingle(0, 0, data)
      const tx = await decompressor.decompressSingleBitCall(_data)
      await tx.wait()
    }
    {
      const tx = await test.testMethod1(v1, v2, eq)
      await tx.wait()
    }
    const bytes = '0x000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
    const hash = ethers.utils.keccak256(bytes)
    {
      const data = compressSingle(receiverIndex, 2, [ bytes, hash ], ['bytes', 'bytes32'])
      const _data = compressSingle(0, 0, data)
      const tx = await decompressor.decompressSingleBitCall(_data)
      await tx.wait()
    }
    {
      const tx = await test.testMethod2(bytes, hash)
      await tx.wait()
    }
  })
})
