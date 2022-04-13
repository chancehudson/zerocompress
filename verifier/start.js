const { ethers } = require('ethers')
const Decompress = require('../artifacts/contracts/Decompress.sol/Decompress.json')
const Verifier = require('../artifacts/contracts/Verifier.sol/Verifier.json')
const { compress, gasCost } = require('../src')
const { promises: fs } = require('fs')
const ParallelPromise = require('@jchancehud/parallel-promise')

const PRIVATE_KEY = '0x0000000000000000000000000000000000000000000000000000000000000001'
// const NODE_URL = 'ws://192.168.1.198:9546'
// const NODE_URL = 'wss://mainnet.optimism.io'
const NODE_URL = 'wss://opt-mainnet.g.alchemy.com/v2/wquJNw5twnWCHVfHU3cGyqKKkV50W9tJ'

async function main() {
  let verifiedCount = 0
  let totalGasSavings = 0
  const ethProvider = new ethers.providers.WebSocketProvider(NODE_URL)
  const end = await ethProvider.getBlockNumber()
  await ParallelPromise(end, async (x) => {
    const block = await ethProvider.getBlockWithTransactions(x)
    const inputTxs = block.transactions.filter((tx) => tx.data && tx.data.length > 2)
    if (inputTxs.length === 0) {
      return
    }
    for (const tx of inputTxs) {
      const [func, data] = compress(tx.data)
      const compressed = `0x${[data].flat().map(d => d.replace('0x', '')).join('')}aaaaaaaa`
      const compressedGas = gasCost(compressed)
      const originalGas = gasCost(tx.data)
      if (compressedGas >= originalGas) continue
      totalGasSavings += originalGas - compressedGas
    }
    console.log(x, end)
    console.log(totalGasSavings)
  }, limit = 40)
  // for (let x = 0; x < end; x++) { }
}

async function deploy(wallet) {
  const DecompressFactory = new ethers.ContractFactory(Decompress.abi, Decompress.bytecode, wallet)
  const decompress = await DecompressFactory.deploy()
  await decompress.deployed()

  const VerifierFactory = new ethers.ContractFactory(Verifier.abi, Verifier.bytecode, wallet)
  const verifier = await VerifierFactory.deploy(decompress.address)
  await verifier.deployed()
  return { verifier, decompress }
}

main()
  .catch((err) => {
    console.log(err)
    process.exit(1)
  })
