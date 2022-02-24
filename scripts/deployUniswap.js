const {
  abi,
  bytecode,
} = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json')
const { ethers } = require('ethers')

const WETH = '0xbc6f6b680bc61e30db47721c6d1c5cde19c1300d'
const DAI = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'

;(async () => {
  const provider = new ethers.providers.JsonRpcProvider('https://kovan.optimism.io')
  const wallet = new ethers.Wallet('0x18ef552014cb0717769838c7536bc1d3b1c800fe351aa2c38ac093fa4d4eb7d6', provider)
  const Factory = new ethers.ContractFactory(abi, bytecode, wallet)
  const factory = await Factory.deploy()
  const r = await factory.createPool(WETH, DAI, 10000).then(t => t.wait())
  const poolAddress = r.events[0]
  console.log(r)
})()
