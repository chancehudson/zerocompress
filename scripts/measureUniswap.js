const { ethers } = require('ethers')
const { abi, bytecode } = require('../artifacts/contracts/UniswapTest.sol/UniswapTest.json')
const { abi: DecompressABI, bytecode: DecompressBytecode } = require('../artifacts/contracts/Decompress.sol/Decompress.json')
const { compressSingle } = require('../src')

;(async () => {
  const provider = new ethers.providers.JsonRpcProvider('https://kovan.optimism.io')
  const wallet = new ethers.Wallet('0x18ef552014cb0717769838c7536bc1d3b1c800fe351aa2c38ac093fa4d4eb7d6', provider)
  const DFactory = new ethers.ContractFactory(DecompressABI, DecompressBytecode, wallet)
  const decompress = await DFactory.deploy()
  const Factory = new ethers.ContractFactory(abi, bytecode, wallet)
  const test = await Factory.deploy(decompress.address)
  await decompress.bindAddress(wallet.address).then(t => t.wait())
  {
    await test.swap(
      wallet.address,
      true,
      1000000,
      20192401,
      '0x00'
    ).then(t => t.wait())
  }
  {
    const calldata = test.interface.encodeFunctionData('swap', [
      wallet.address,
      true,
      1000000,
      20192401,
      '0x00'
    ])
    const [func, data] = compressSingle(calldata, {
      addressSubs: {
        [wallet.address]: 1,
      }
    })
    await test[func](data).then(t => t.wait())
  }

})()
