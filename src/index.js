const BN = require('bn.js')
const { ethers } = require('ethers')
const RegistryABI = require('./AddressRegistryABI.json')

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
 * @returns A bytes array that can be used as an argument for the decompressor
 **/
function compressSingle(calldata, options = {}) {
  // defaults
  Object.assign(options, {
    addressSubs: {},
    ...options,
  })
  options.addressSubs = Object.keys(options.addressSubs).reduce((acc, key) => {
    return {
      [key.toLowerCase()]: options.addressSubs[key],
      ...acc,
    }
  }, {})
  // now do single bit compression
  let rawData = calldata.replace('0x', '').toLowerCase()
  // first look for addresses, then replace them with a marker
  // then during iteration below insert the opcode logic
  // returns de-duplicated addresses
  const addresses = findAddresses(rawData).filter(a => options.addressSubs[a])
  const addressOpcodes = {}
  let subByte

  for (const a of addresses) {
    subByte = nextSubstitutionByte(subByte)
    // re-pad it and insert a marker
    const subhex = new BN(options.addressSubs[a]).toString(16, 6)
    // leading 00 to indicate an opcode
    // opcode 02 indicating address replacement
    // 3 bytes indicating the address id
    const opcode = `0002${subhex}`
    addressOpcodes[subByte] = opcode
    const fullAddress = `000000000000000000000000${a.replace('0x', '')}`
    rawData = rawData.replace(new RegExp(fullAddress, 'g'), subByte)
  }

  const compressedBits = []
  // can be strings of arbitrary length (%2=0) hex, not just single bytes
  const uniqueBytes = []
  for (let x = 0; x < rawData.length / 2; x++) {
    const byte = rawData.slice(x * 2, x * 2 + 2)
    if (byte === '00') {
      compressedBits.push('0')
    } else if (/[a-fA-F0-9]{2}/.test(byte)){
      // valid hex
      compressedBits.push('1')
      uniqueBytes.push(byte)
    } else if (addressOpcodes[byte]) {
      // address opcode
      uniqueBytes.push(addressOpcodes[byte])
      compressedBits.push('1')
    } else {
      throw new Error(`Unrecognized byte string "${byte}"`)
    }
  }
  // console.log(uniqueBytes)
  // now convert the binary to hex and abi encode the unique bytes
  const reverse = (str) => str.split('').reverse().join('')
  const bytes = []
  const _compressedBits = compressedBits.join('')
  for (let x = 0; x < _compressedBits.length / 8; x++) {
    const byte = new BN(
      reverse(_compressedBits.slice(x * 8, x * 8 + 8)),
      2
    ).toString(16, 2)
    bytes.push(byte)
  }
  const _data = bytes.join('')
  const uniqueData = uniqueBytes.join('')
  // now store a length identifier in a uint24, supports a length of 16 MB
  const dataLength = new BN(_data.length / 2).toString(16, 6)
  const finalLength = new BN(calldata.replace('0x', '').length / 2).toString(16, 4)
  const finalData = `${dataLength}${finalLength}${_data}${uniqueData}`
  const MAX_LENGTH = (32 * 32 * 2 - 1) // subtract one to account for type byte
  if (finalData.length > MAX_LENGTH) {
    return [
      `decompressSingleBitCall(bytes)`,
      `0x${finalData}`
    ]
  }
  const fillDataLength = 64 - ((finalData.length + 2) % 64)
  const fillData = Array(fillDataLength).fill('0').join('')
  const chunks = chunkString(`00${finalData}${fillData}`, 64)
  return [
    `decompress(bytes32[${chunks.length}])`,
    chunks.map(d => `0x${d}`)
  ]
}

function compressDouble(calldata) {
  const bestSaving = findBestZeroRepeat(calldata)
  // now do single bit compression
  const _rawData = calldata.replace('0x', '')
  let rawData = _rawData
  let offset = 0
  for (;;) {
    if (bestSaving.length === 0) break
    const index = rawData.indexOf(bestSaving, offset)
    if (index === -1) break
    if (index % 2 === 1) {
      offset = index + 1
      if (rawData.indexOf(bestSaving, offset) !== offset) continue
      rawData = `${rawData.slice(0, index+1)}xx${rawData.slice(index + 1 + bestSaving.length)}`
    } else rawData = rawData.replace(bestSaving, 'xx')
  }
  const secondBestSaving = findBestZeroRepeat(rawData)
  offset = 0
  for (;;) {
    if (secondBestSaving.length === 0) break
    const index = rawData.indexOf(secondBestSaving)
    if (index === -1) break
    if (index % 2 === 1) {
      offset = index + 1
      if (rawData.indexOf(secondBestSaving, offset) !== offset) continue
      rawData = `${rawData.slice(0, index+1)}yy${rawData.slice(index + 1 + secondBestSaving.length)}`
    } else rawData = rawData.replace(secondBestSaving, 'yy')
  }
  // console.log(rawData)
  const compressedBits = []
  const uniqueBytes = []
  for (let x = 0; x < rawData.length / 2; x++) {
    const byte = rawData.slice(x * 2, x * 2 + 2)
    if (byte === 'xx') {
      compressedBits.push('01')
    } else if (byte === 'yy') {
      compressedBits.push('11')
    } else if (byte === '00') {
      compressedBits.push('00')
    } else {
      compressedBits.push('10')
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
    ).toString(16, 2)
    bytes.push(byte)
  }
  const _data = bytes.join('')
  const uniqueData = uniqueBytes.join('')
  // now store a length identifier in a uint24, supports a length of 16 MB
  const bestSavingHex = new BN(bestSaving.length / 2).toString(16, 2)
  const secondBestSavingHex = new BN(secondBestSaving.length / 2).toString(16, 2)
  const lengthBytes = new BN(_data.length / 2).toString(16, 6)
  const finalLength = new BN(calldata.replace('0x', '').length / 2).toString(16, 4)
  const mainData = `${lengthBytes}${finalLength}${_data}${uniqueData}`
  const suffixData = `${bestSavingHex}${secondBestSavingHex}`
  const MAX_LENGTH = (32 * 32 * 2 - 1) // subtract one to account for type byte
  if (mainData.length + suffixData.length > MAX_LENGTH) {
    return [
      `decompressDoubleBitCall(bytes)`,
      `0x${mainData}${suffixData}`
    ]
  }
  const fillDataLength = 64-((mainData.length + suffixData.length + 2) % 64)
  // otherwise split to bytes32[]
  const fillData = Array(fillDataLength).fill('0').join('')
  // 01 is the type byte
  const finalData = `01${mainData}${fillData}${suffixData}`
  const chunks = chunkString(finalData, 64)
  return [
    `decompress(bytes32[${chunks.length}])`,
    chunks.map(c => `0x${c}`)
  ]
}

function chunkString(str, chunkSize = 64) {
  if (str.length % chunkSize !== 0) {
    throw new Error('String cannot be chunked evenly')
  }
  const charArr = str.split('')
  const chunks = []
  for (;;) {
    if (charArr.length === 0) return chunks
    chunks.push(charArr.splice(0, chunkSize).join(''))
  }
}

function nextSubstitutionByte(current) {
  const charset = 'ghijklmnopqrstuvwxyz'
  if (!current) return 'gg'
  if (current === 'zz') throw new Error('No more substitution bytes')
  if (current.length !== 2) throw new Error('Invalid current substitution byte')
  if (current[1] === 'z') {
    const index = charset.indexOf(current[0])
    return `${charset[index+1]}g`
  } else {
    const index = chaset.indexOf(current[1])
    return `${current[0]}${charset[index+1]}`
  }
}

// accepts a structure function call for `data` (4 byte sig, 32 byte args)
function findAddresses(data) {
  const args = data.replace('0x', '').slice(8)
  // now check every 32 byte value to see if it's an address (12 leading 0 bytes)
  const chunks = chunkString(args)
  const addresses = []
  for (const chunk of chunks) {
    if (!chunk.startsWith('000000000000000000000000')) continue
    addresses.push('0x'+chunk.slice(24))
  }
  const dupes = {}
  // dedupe
  return addresses.filter(a => {
    if (dupes[a]) return false
    dupes[a] = true
    return true
  })
}

function findBestZeroRepeat(data) {
  let bestSavings = 0
  let repeat = ''
  for (let x = 6; x < 255; x+=2) {
    const repeats = findRepeats(data, x)
    for (const k of Object.keys(repeats)) {
      if (!/^0+$/.test(k)) {
        continue
      }
      const cost = gasCost(k)
      const savings = cost * repeats[k] - repeats[k] * 16
      if (savings > bestSavings) {
        bestSavings = savings
        repeat = k
      }
    }
  }
  return repeat
}

function findRepeats(_data, windowSize = 4) {
  const data = _data.replace('0x')
  const repeatCounts = {}
  for (let x = 0; x < data.length / 2 - windowSize; x++) {
    const thisWindow = data.slice(x*2, x*2 + windowSize*2)
    // if (thisWindow == Array(windowSize*2).fill('0').join('')) continue
    let repeats = 0
    let latestOffset = 0
    for (;;) {
      let i = data.indexOf(thisWindow, latestOffset)
      if (i % 2 === 1) i = data.indexOf(thisWindow, i+1)
      if (i === -1) break
      latestOffset = i + windowSize*2
      repeats++
    }
    if (repeats < 1) continue
    repeatCounts[thisWindow] = repeats
  }
  return repeatCounts
}

// calculate the gas cost of some calldata
function gasCost(_data) {
  if (_data.length % 2 !== 0) throw new Error('Hex data not even length')
  const data = _data.replace('0x', '')
  let totalGas = 0
  for (let x = 0; x < data.length / 2; x++) {
    const byte = data.slice(x*2, x*2 + 2)
    if (byte == '00') totalGas += 4
    else totalGas += 16
  }
  return totalGas
}
