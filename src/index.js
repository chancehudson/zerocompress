const BN = require('bn.js')
const { ethers } = require('ethers')

module.exports = {
  compressSingle,
  compressDouble,
}

/**
 * Encode calldata along with metadata indicating which contract to invoke
 * @param number receiver - Index of the contract that should receive the call
 * @param number method - The method to invoke in the receiving contract
 * @param object data - The arguments to be passed to the receiving contract
 * @param object functionForm - ABI format for encoding the data
 * @returns Two bytes arrays that can be used as arguments for the decompressor
 **/
function compressSingle(receiver, method, data, functionFormat) {
  const calldata = encodeCalldata(receiver, method, data, functionFormat)
  // now do single bit compression
  const rawData = calldata.replace('0x', '')
  const compressedBits = []
  const uniqueBytes = []
  for (let x = 0; x < rawData.length / 2; x++) {
    const byte = rawData.slice(x * 2, x * 2 + 2)
    if (byte === '00') {
      compressedBits.push('0')
    } else {
      compressedBits.push('1')
      uniqueBytes.push(byte)
    }
  }
  // now convert the binary to hex and abi encode the unique bytes
  const reverse = (str) => str.split('').reverse().join('')
  const bytes = []
  const _compressedBits = compressedBits.join('')
  for (let x = 0; x < _compressedBits.length / 8; x++) {
    const byte = new BN(
      reverse(_compressedBits.slice(x * 8, x * 8 + 8)),
      2
    ).toString(16)
    bytes.push(byte.length === 1 ? `0${byte}` : byte)
  }
  const _data = '0x' + bytes.join('')
  const uniqueData = '0x' + uniqueBytes.join('')
  return [_data, uniqueData]
}

function compressDouble(receiver, method, data, functionFormat) {
  const calldata = encodeCalldata(receiver, method, data, functionFormat)
  // now do single bit compression
  const rawData = calldata.replace('0x', '')
  // console.log(rawData)
  const compressedBits = []
  const uniqueBytes = []
  for (let x = 0; x < rawData.length / 2; x++) {
    const byte = rawData.slice(x * 2, x * 2 + 2)
    if (byte === '00') {
      compressedBits.push('00')
    } else {
      compressedBits.push('11')
      uniqueBytes.push(byte)
    }
  }
  // now convert the binary to hex and abi encode the unique bytes
  const reverse = (str) => str.split('').reverse().join('')
  const bytes = []
  const _compressedBits = compressedBits.join('')
  for (let x = 0; x < _compressedBits.length / 8; x++) {
    const byte = new BN(
      reverse(_compressedBits.slice(x * 8, x * 8 + 8)),
      2
    ).toString(16)
    bytes.push(byte.length === 1 ? `0${byte}` : byte)
  }
  const _data = '0x' + bytes.join('')
  const uniqueData = '0x' + uniqueBytes.join('')
  return [_data, uniqueData]
}

function compressRepeats(receiver, method, data, functionFormat) {
  const calldata = encodeCalldata(receiver, method, data, functionFormat)
}

function encodeCalldata(receiver, method, data, functionFormat) {
  const functionData = ethers.utils.defaultAbiCoder.encode(
    Array.isArray(functionFormat) ? functionFormat : [functionFormat],
    Array.isArray(data) ? data : [data],
  )
  return ethers.utils.defaultAbiCoder.encode(
    ['uint24', 'uint8', 'bytes'],
    [
      receiver,
      method,
      functionData,
    ]
  )
}
