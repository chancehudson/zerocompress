const { ethers, BigNumber, utils } = require("ethers");

const {
	abi: DecompressAbi,
} = require("../artifacts/contracts/Decompressor.sol/Decompressor.json");
const Verifier = require("../artifacts/contracts/Verifier.sol/Verifier.json");
const { compress, gasCost } = require("../src");
const pako = require("pako");

const PRIVATE_KEY =
	"0x0000000000000000000000000000000000000000000000000000000000000001";
const NODE_URL =
	"https://opt-mainnet.g.alchemy.com/v2/qW4De9jQckF_mry2bOCI5bE7Gb-X8m48";

function numberTo3ByteUint8Arr(number) {
	let bArr = ethers.utils.arrayify(BigNumber.from(number).toHexString());

	// length of byte arr should be 3
	let rArr = new Uint8Array([0, 0, 0]);
	for (let i = 0; i < 3; i++) {
		rArr[2 - i] = bArr[bArr.length - 1 - i] ? bArr[bArr.length - 1 - i] : 0;
	}
	return rArr;
}

function gasCostByteArr(byteArr) {
	let cost = 0;
	for (let i = 0; i < byteArr.length; i++) {
		if (byteArr[i] == 0) {
			cost += 4;
		} else {
			cost += 16;
		}
	}
	return cost;
}

async function main() {
	const ethProvider = new ethers.providers.JsonRpcProvider(NODE_URL);

	const end = await ethProvider.getBlockNumber();

	let averageSavings = 0

	let oBuffer = new Uint8Array([]);
	let cBuffer = new Uint8Array([]);
	let txsProcessed = 0;
	for (let i = 500; i > 0; i--) {
		const block = await ethProvider.getBlockWithTransactions(end - i);

		// skip if no txs OR
		// tx.v == 0.
		// TODO: ethers throws invalid chainId error when v == 0 in
		// serializeTransaction() fn
		for (const tx of block.transactions) {
			if (tx.v == 0) continue
			let oTx = {
				to: tx.to,
				nonce: tx.nonce,
				gasLimit: tx.gasLimit,
				gasPrice: tx.gasPrice,
				data: tx.data,
				value: tx.value,
			};
			let sig = {
				v: tx.v,
				r: tx.r,
				s: tx.s,
			};
			// tx with compressed calldata
			let cTx = {
				...oTx,
			};

			// only compress if there's some data
			if (oTx.data == "0x") continue
			const [func, data] = compress(oTx.data, {
				addressSubs: {
					'*': 129124
				}
			});
			const decompressorI = new ethers.utils.Interface(DecompressAbi);
			const compressedCalldata = decompressorI.encodeFunctionData(func, [
				data,
			]);
			// only replace calldata in compressed tx if there's some savings
			if (gasCost(compressedCalldata) < gasCost(oTx.data)) {
				cTx.data = compressedCalldata;
				console.log(`compressed by ${gasCost(oTx.data) - gasCost(compressedCalldata)}`)
			}

			// serialize tx
			// RLP encoding of serializeTransaction for
			// legacy txs follows the same
			// pattern as OPs RLP encoding of txData.
			// Don't include chainId and type, since OPs
			// txData does not contain them.
			// Also prepend tx size of 3 bytes to encoded txData since OPs does it.
			let oTxByteArr = new Uint8Array([
				...numberTo3ByteUint8Arr(
					ethers.utils.arrayify(
						ethers.utils.serializeTransaction(oTx, sig)
					).length
				),
				...ethers.utils.arrayify(
					ethers.utils.serializeTransaction(oTx, sig)
				),
			]);
			oBuffer = new Uint8Array([...oBuffer, ...oTxByteArr]);
			let cTxByteArr = new Uint8Array([
				...numberTo3ByteUint8Arr(
					ethers.utils.arrayify(
						ethers.utils.serializeTransaction(cTx, sig)
					).length
				),
				...ethers.utils.arrayify(
					ethers.utils.serializeTransaction(cTx, sig)
				),
			]);
			cBuffer = new Uint8Array([...cBuffer, ...cTxByteArr]);
			txsProcessed += 1;
		}
		// compress buffers
		if (txsProcessed >= 100) {
			txsProcessed = 0
			oBufferC = pako.deflate(oBuffer);
			cBufferC = pako.deflate(cBuffer);
			console.log(oBuffer)
			console.log(cBuffer)
			console.log(`
		        Transactions Processed: ${txsProcessed}
			    Batch data without zlib:
			        original     -  size=${oBuffer.length} bytes
		                            gas cost=${gasCostByteArr(oBuffer)}
			        zerocompress -  size=${cBuffer.length} bytes
		                            gas cost=${gasCostByteArr(cBuffer)}
			    Batch data with zlib:
		            original     -  size=${oBufferC.length} bytes
		                            gas cost=${gasCostByteArr(oBufferC)}
			        zerocompress -  size=${cBufferC.length} bytes
		                            gas cost=${gasCostByteArr(cBufferC)}
			`);
		}

	}

}

main().catch((err) => {
	console.log(err);
	process.exit(1);
});

/**

OPs Transaction
type Transaction struct {
	data txdata
	meta TransactionMeta
	// caches
	hash atomic.Value
	size atomic.Value
	from atomic.Value
}

OPs txData
type txdata struct {
	AccountNonce uint64          `json:"nonce"    gencodec:"required"`
	Price        *big.Int        `json:"gasPrice" gencodec:"required"`
	GasLimit     uint64          `json:"gas"      gencodec:"required"`
	Recipient    *common.Address `json:"to"       rlp:"nil"` // nil means contract creation
	Amount       *big.Int        `json:"value"    gencodec:"required"`
	Payload      []byte          `json:"input"    gencodec:"required"`

	// Signature values
	V *big.Int `json:"v" gencodec:"required"`
	R *big.Int `json:"r" gencodec:"required"`
	S *big.Int `json:"s" gencodec:"required"`

	// This is only used when marshaling to JSON.
	Hash *common.Hash `json:"hash" rlp:"-"`
}


OPs CachedTx
type CachedTx struct {
	tx    *l2types.Transaction
	rawTx []byte
}
Note - rawTx is RLP encoded value of Transaction.data (i.e. of type txData)

 **/
