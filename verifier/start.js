const { ethers } = require('ethers')
const Decompress = require('../artifacts/contracts/Decompress.sol/Decompress.json')
const Verifier = require('../artifacts/contracts/Verifier.sol/Verifier.json')
const { compress } = require('../src')

const PRIVATE_KEY = '0x0000000000000000000000000000000000000000000000000000000000000001'
const NODE_URL = 'ws://192.168.1.198:9546'

async function main() {
  let verifiedCount = 0
  // start watching for optimism transactions and try to compress
  // and then decompress all of them
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
  const { verifier, decompress } = await deploy(wallet)
  // now start watching for transactions
  const ethProvider = new ethers.providers.WebSocketProvider(NODE_URL)
  let start = await ethProvider.getBlockNumber()
  while (start > 0) {
    const block = await ethProvider.getBlockWithTransactions(start)
    for (const tx of block.transactions) {
      if (!tx.data || tx.data.length <= 2) continue
      // otherwise try compressing
      const [ func, data ] = compress(tx.data)
      const out = await verifier[func](data)
      if (out !== tx.data) {
        console.log('Compression mismatch!')
        console.log(tx.hash)
      } else {
        verifiedCount++
        if (verifiedCount % 100 === 0) {
          console.log(`Verified ${verifiedCount} transactions`)
        }
      }
    }
    start--
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
