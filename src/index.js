const BN = require('bn.js')
const { ethers } = require('ethers')
const AddressRegistryABI = require('./AddressRegistryABI.json')
const BLSKeyRegistryABI = require('./BLSKeyRegistryABI.json')

module.exports = {
  compress,
  gasCost,
  AddressRegistryABI,
  BLSKeyRegistryABI,
  decompressAddress: '0x75b6fA14947E6B524ECEf46a6A4A3c1D0E0b62dF',
}

/**
 * Compress calldata and return a function to call along with data to pass
 **/
function compress(calldata, options = {}) {
  // defaults
  Object.assign(options, {
    addressSubs: {},
    blsPubkeySubs: [],
    ...options,
  })
  options.addressSubs = Object.keys(options.addressSubs).reduce((acc, key) => {
    return {
      [key.toLowerCase()]: options.addressSubs[key],
      ...acc,
    }
  }, {})
  options.blsPubkeySubs = options.blsPubkeySubs.map(([pubkey, id])=> {
    return [
      pubkey.map(k => k.replace('0x', '').toLowerCase()),
      id,
    ]
  })
  // now do single bit compression
  let rawData = calldata.replace('0x', '').toLowerCase()
  let subByte

  // do 0xff subs if needed
  const maxOpcodes = {}
  const maxTest = /(ff){16,32}(?=(?:[\da-zA-Z]{2})*$)/
  for (;;) {
    const r = maxTest.exec(rawData)
    if (r === null) break
    const { index } = r
    const [ match ] = r
    subByte = nextSubstitutionByte(subByte)
    if (match.length % 2 !== 0) throw new Error('Invalid length')
    const lengthHex = new BN(225 + (match.length/2 - 16)).toString(16, 2)
    const opcode = `00${lengthHex}`
    maxOpcodes[subByte] = opcode
    rawData = `${rawData.slice(0, index)}${subByte}${rawData.slice(index+match.length)}`
  }

  const blsOpcodes = {}
  for (const [pubkey, id] of options.blsPubkeySubs) {
    subByte = nextSubstitutionByte(subByte)
    let opcode
    if (id < 2**8) {
      // 1 byte
      const op = new BN(247).toString(16, 2)
      const subhex = new BN(id).toString(16, 2)
      opcode = `00${op}${subhex}`
    } else if (id < 2**16) {
      // 2 bytes
      const op = new BN(248).toString(16, 2)
      const subhex = new BN(id).toString(16, 4)
      opcode = `00${op}${subhex}`
    } else if (id < 2**24) {
      // 3 bytes
      const op = new BN(249).toString(16, 2)
      const subhex = new BN(id).toString(16, 6)
      opcode = `00${op}${subhex}`
    } else if (id < 2**32) {
      // 4 bytes
      const op = new BN(250).toString(16, 2)
      const subhex = new BN(id).toString(16, 8)
      opcode = `00${op}${subhex}`
    } else if (id < 2**40) {
      // 5 bytes
      const op = new BN(251).toString(16, 2)
      const subhex = new BN(id).toString(16, 10)
      opcode = `00${op}${subhex}`
    } else {
      throw new Error('bls pubkey sub number is out of range')
    }
    blsOpcodes[subByte] = opcode
    rawData = replaceEvenIndexes(rawData, pubkey.join(''), subByte)
  }

  // look for addresses, then replace them with a marker
  // then during iteration below insert the opcode logic
  // returns de-duplicated addresses
  const addressOpcodes = {}
  for (const a of Object.keys(options.addressSubs)) {
    const id = options.addressSubs[a] || options.addressSubs['*']
    subByte = nextSubstitutionByte(subByte)
    // re-pad it and insert a marker
    let opcode
    if (id < 2**8) {
      // 1 byte
      const op = new BN(242).toString(16, 2)
      const subhex = new BN(id).toString(16, 2)
      opcode = `00${op}${subhex}`
    } else if (id < 2**16) {
      // 2 bytes
      const op = new BN(243).toString(16, 2)
      const subhex = new BN(id).toString(16, 4)
      opcode = `00${op}${subhex}`
    } else if (id < 2**24) {
      // 3 bytes
      const op = new BN(244).toString(16, 2)
      const subhex = new BN(id).toString(16, 6)
      opcode = `00${op}${subhex}`
    } else if (id < 2**32) {
      // 4 bytes
      const op = new BN(245).toString(16, 2)
      const subhex = new BN(id).toString(16, 8)
      opcode = `00${op}${subhex}`
    } else if (id < 2**40) {
      // 5 bytes
      const op = new BN(246).toString(16, 2)
      const subhex = new BN(id).toString(16, 10)
      opcode = `00${op}${subhex}`
    } else {
      throw new Error('Address sub number is out of range')
    }
    // leading 00 to indicate an opcode
    // opcode 02 indicating address replacement
    // 3 bytes indicating the address id
    if (a === '*') {
      addressOpcodes[subByte] = opcode
      const before = rawData.length
      // TODO: better check for address formed (e.g. < 5 zeroes)
      rawData = rawData.replace(/0{24}[a-fA-F0-9]{40}(?=(?:[\da-zA-Z]{2})*$)/, subByte)
    } else {
      addressOpcodes[subByte] = opcode
      const fullAddress = `000000000000000000000000${a.replace('0x', '')}`
      rawData = replaceEvenIndexes(rawData, fullAddress, subByte)
    }
  }

  // now do 0 subs if needed
  // https://stackoverflow.com/questions/31147478/regex-that-only-matches-on-odd-even-indices
  const zeroOpcodes = {}
  const bytesByOpcode = {}
  const zeroTest = /(00){24,224}(?=(?:[\da-zA-Z]{2})*$)/
  let zeroSubLength = ''
  for (;;) {
    const r = zeroTest.exec(rawData)
    if (r === null) break
    const { index } = r
    const [ match ] = r
    if (match.length % 2 !== 0) throw new Error('Invalid length')
    const lengthHex = new BN(match.length/2).toString(16, 2)
    const opcode = `00${lengthHex}`
    if (!bytesByOpcode[opcode]) {
      subByte = nextSubstitutionByte(subByte)
      zeroOpcodes[subByte] = opcode
      bytesByOpcode[opcode] = subByte
    }
    rawData = `${rawData.slice(0, index)}${bytesByOpcode[opcode]}${rawData.slice(index+match.length)}`
  }
  {
    // determine if we should use the 0000 opcode
    let sub
    let bestCount = 1
    for (const key of Object.keys(zeroOpcodes)) {
      const count = chunkString(rawData, 2).filter(k => k === key).length
      if (count > bestCount) {
        const length = zeroOpcodes[key].slice(2)
        zeroSubLength = new BN(length, 16).toString(16, 2)
        sub = key
        bestCount = count
      }
    }
    if (sub) {
      zeroOpcodes[sub] = '0000'
    }
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
    } else if (zeroOpcodes[byte]) {
      uniqueBytes.push(zeroOpcodes[byte])
      compressedBits.push('1')
    } else if (maxOpcodes[byte]) {
      uniqueBytes.push(maxOpcodes[byte])
      compressedBits.push('1')
    } else if (blsOpcodes[byte]) {
      uniqueBytes.push(blsOpcodes[byte])
      compressedBits.push('1')
    } else {
      throw new Error(`Unrecognized byte string "${byte}"`)
    }
  }
  // console.log(uniqueBytes)
  // now convert the binary to hex and abi encode the unique bytes
  const reverse = (str) => str.split('').reverse().join('')
  const bytes = []
  let _compressedBits = compressedBits.join('')
  // regex to look for bits at the end
  const lastBit = _compressedBits[_compressedBits.length - 1]
  const trailingBits = new RegExp(`${lastBit}+$`)
  const [ match ] = _compressedBits.match(trailingBits)
  if (match.length === _compressedBits.length) {
    _compressedBits = ''
  } else {
    _compressedBits = _compressedBits.slice(0, -1 * match.length)
  }
  // the last bit has to be the same for us to make an inference
  // if there are 7 bits in the last word we'll pad below so don't worry about
  // it here
  if (_compressedBits[_compressedBits.length - 1] !== lastBit && _compressedBits.length % 8 !== 7 && _compressedBits.length !== 0) {
    _compressedBits = _compressedBits + lastBit
  }
  // pad the byte if we are inserting 1's so we don't get 0 padded
  if (lastBit === '1' && _compressedBits.length % 8 !== 0) {
    // we need to make sure the bit array is %8=0 so no trailing 0's are added
    const insert = 8 - _compressedBits.length % 8
    _compressedBits = _compressedBits + Array(insert).fill('1').join('')
  }
  // the default is 1 so if there is no data we need to insert 0's if the last
  // bit is 0
  if (_compressedBits.length === 0 && lastBit === '0') {
    _compressedBits = Array(8).fill('0').join('')
  }
  if (_compressedBits.length % 8 !== 0) {
    const fillCount = 8 - _compressedBits.length % 8
    _compressedBits = _compressedBits + Array(fillCount).fill('0').join('')
  }
  // flip the ones and zeroes if it's profitable
  let onesAreZeroes = false
  const zeroChunks = chunkString(_compressedBits, 8).filter((c) => +c === 0).length
  const ffChunks = chunkString(_compressedBits, 8).filter((c) => c === '11111111').length
  if (ffChunks > zeroChunks) {
    onesAreZeroes = true
  }
  const finalBits = _compressedBits.split('').map(b => {
    if (!onesAreZeroes) return b
    return b === '0' ? '1' : '0'
  }).join('')
  for (let x = 0; x < _compressedBits.length / 8; x++) {
    const byte = new BN(
      reverse(finalBits.slice(x * 8, x * 8 + 8)),
      2
    ).toString(16, 2)
    bytes.push(byte)
  }
  const _data = bytes.join('')
  const uniqueData = uniqueBytes.join('')
  // now store length identifiers as short as needed
  // must exactly match the logic in the smart contract
  let dataLength, finalLength
  let dataBytesLength, finalBytesLength, dataLengthBits
  if (_data.length / 2 < 8) {
    // can store in the leading byte
    dataLengthBits = reverse(new BN(_data.length / 2).toString(2, 3))
    dataBytesLength = '00'
    dataLength = ''
  } else {
    // need to store in trailing bytes
    dataLengthBits = '000'
    const bytesNeeded = (_data.length / 2) < 256 ? 1 : 2
    dataBytesLength = bytesNeeded === 1 ? '10' : '01'
    dataLength = new BN(_data.length / 2).toString(16, bytesNeeded * 2)
  }
  const calldataByteLength = calldata.replace('0x', '').length / 2
  if (calldataByteLength < 256) {
    finalBytesLength = '10'
    finalLength = new BN(calldataByteLength).toString(16, 2)
  } else if (calldataByteLength >= 256 && calldataByteLength < 65536) {
    finalBytesLength = '01'
    finalLength = new BN(calldataByteLength).toString(16, 4)
  } else {
    finalBytesLength = '11'
    finalLength = new BN(calldataByteLength).toString(16, 6)
  }
  const configByte = new BN(
    reverse(`${onesAreZeroes ? 1 : 0}${dataBytesLength}${finalBytesLength}${dataLengthBits}`),
    2
  ).toString(16, 2)
  const finalData = `${configByte}${dataLength}${finalLength}${_data}${uniqueData}${zeroSubLength}`
  const MAX_LENGTH = (32 * 32 * 2 - 1) // subtract one to account for type byte
  if (finalData.length > MAX_LENGTH) {
    return [
      `decompressSingleBitCall(bytes)`,
      `0x${finalData}`
    ]
  }
  const chunks = []
  if (finalData.length % 64 !== 0) {
    const fillDataLength = 64 - ((finalData.length) % 64)
    const fillData = Array(fillDataLength).fill('0').join('')
    chunks.push(...chunkString(`${finalData.slice(0, zeroSubLength ? -2 : undefined)}${fillData}${zeroSubLength}`, 64))
  } else {
    chunks.push(...chunkString(finalData, 64))
  }
  return [
    `decompress(bytes32[${chunks.length}])`,
    chunks.map(d => `0x${d}`),
    finalData.length % 64 === 0 ? 0 : (64 - ((finalData.length) % 64))/2 // number of padding bytes
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
    const index = charset.indexOf(current[1])
    return `${current[0]}${charset[index+1]}`
  }
}

// replace a substring that exists only at even indexes
// do it as many times as possible
function replaceEvenIndexes(_str, substr, replacement) {
  let str = _str
  let minIndex = 0
  for (;;) {
    const index = str.indexOf(substr, minIndex)
    if (index === -1) return str
    if (index % 2 === 1) {
      minIndex = index
      continue
    }
    // otherwise do the replacement
    str = `${str.slice(0, index)}${replacement}${str.slice(index + substr.length)}`
    minIndex += replacement.length
  }
  return str
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
