const { ethers } = require('ethers')
const Decompress = require('../artifacts/contracts/Decompress.sol/Decompress.json')
const Verifier = require('../artifacts/contracts/Verifier.sol/Verifier.json')
const { compress } = require('../src')
const { promises: fs } = require('fs')

const PRIVATE_KEY = '0x0000000000000000000000000000000000000000000000000000000000000001'
// const NODE_URL = 'ws://192.168.1.198:9546'
// const NODE_URL = 'wss://mainnet.optimism.io'

async function main() {
  let verifiedCount = 0
  const ethProvider = new ethers.providers.WebSocketProvider(NODE_URL)
  const end = await ethProvider.getBlockNumber()
  for (let x = 0; x < end; x++) {
    const block = await ethProvider.getBlockWithTransactions(x)
    const inputTxs = block.transactions.filter((tx) => tx.data && tx.data.length > 2)
    if (inputTxs.length === 0) {
      await new Promise(r => setTimeout(r, 1000))
      continue
    }
    const rows = inputTxs
      .map((tx) => `${x},${tx.from},${tx.to},${tx.data}`)
      .join('\n') + '\n'
    await fs.appendFile('./blocks.csv', rows)
    await new Promise(r => setTimeout(r, 1000))
  }
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
