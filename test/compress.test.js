const { ethers } = require('hardhat')
const assert = require('assert')
const { compressSingle, compressDouble } = require('../src')

async function getDeployedContracts() {
  const Decompress = await ethers.getContractFactory('Decompress')
  const decompress = await Decompress.deploy()
  await decompress.deployed()

  const Test = await ethers.getContractFactory('Test', {
    libraries: {
      Decompress: decompress.address,
    }
  })
  const test = await Test.deploy()
  await test.deployed()

  return { test }
}

describe('decompressor', () => {
  it('should single compress and call a function', async () => {
    const { test } = await getDeployedContracts()
    const v1 = 150
    const v2 = 150
    const eq = true
    {
      const data = compressDouble(1, [ v1, v2, eq ], ['uint', 'uint', 'bool'])
      const tx = await test.decompressDoubleBitCall(data)
      await tx.wait()
    }
    {
      const data = compressSingle(1, [ v1, v2, eq ], ['uint', 'uint', 'bool'])
      const tx = await test[`decompress${data.length}`](data)
      await tx.wait()
    }
    {
      const tx = await test.testMethod1(v1, v2, eq)
      await tx.wait()
    }
    const bytes = '0x000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
    const hash = ethers.utils.keccak256(bytes)
    {
      const data = compressDouble(2, [ bytes, hash ], ['bytes', 'bytes32'])
      const tx = await test.decompressDoubleBitCall(data)
      await tx.wait()
    }
    {
      const data = compressSingle(2, [ bytes, hash ], ['bytes', 'bytes32'])
      const tx = await test[`decompress${data.length}`](data)
      await tx.wait()
    }
    {
      const tx = await test.testMethod2(bytes, hash)
      await tx.wait()
    }
  })

  // it('should double compress and call function', async () => {
  //   const { test } = await getDeployedContracts()
  //   const v1 = 150
  //   const v2 = 150
  //   const eq = true
  //   {
  //     const data = compressSingle(1, [ v1, v2, eq ], ['uint', 'uint', 'bool'])
  //     const _data = compressSingle(0, data)
  //     const tx = await test.decompressSingleBitCall(_data)
  //     await tx.wait()
  //   }
  //   {
  //     const tx = await test.testMethod1(v1, v2, eq)
  //     await tx.wait()
  //   }
  //   const bytes = '0x000000000000000000000000000000000000000000000000000000000000000000000000000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
  //   const hash = ethers.utils.keccak256(bytes)
  //   {
  //     const data = compressSingle(2, [ bytes, hash ], ['bytes', 'bytes32'])
  //     const _data = compressSingle(0, data)
  //     const tx = await test.decompressSingleBitCall(_data)
  //     await tx.wait()
  //   }
  //   {
  //     const tx = await test.testMethod2(bytes, hash)
  //     await tx.wait()
  //   }
  // })
})
