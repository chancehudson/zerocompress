const { ethers } = require('hardhat')
const assert = require('assert')
const { compressSingle } = require('../src')

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
  it('single compresses and calls a function', async () => {
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
      const [data, uniques] = compressSingle(receiverIndex, 1, [ v1, v2, eq ], ['uint', 'uint', 'bool'])
      const tx = await decompressor.decompressSingleBitCall(data, uniques)
      await tx.wait()
    }
    {
      const tx = await test.testMethod1(v1, v2, eq)
      await tx.wait()
    }
    const bytes = '0x0000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
    {
      const [data, uniques] = compressSingle(receiverIndex, 2, [ bytes ], ['bytes'])
      const tx = await decompressor.decompressSingleBitCall(data, uniques)
      await tx.wait()
    }
    {
      const tx = await test.testMethod2(bytes)
      await tx.wait()
    }
  })
})
