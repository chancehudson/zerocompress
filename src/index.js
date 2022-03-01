const BN = require('bn.js')
const { ethers } = require('ethers')
const RegistryABI = require('./AddressRegistryABI.json')

/**
 * Leading bit indicating whether a 0 indicates a 0 or 1
 * Cut trailing bits if they're all the same
 * Fixed length 0xff byte insertion
 **/

module.exports = {
  compress,
  gasCost,
}

/**
 * Encode calldata along with metadata indicating which contract to invoke
 * @param number receiver - Index of the contract that should receive the call
 * @param number method - The method to invoke in the receiving contract
 * @param object data - The arguments to be passed to the receiving contract
 * @param object functionForm - ABI format for encoding the data
 * @returns A bytes array that can be used as an argument for the decompressor
 **/
function compress(calldata, options = {}) {
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
  let subByte

  // do 0xff subs if needed
  const maxOpcodes = {}
  const maxTest = /(ff){4,88}(?=(?:[\da-zA-Z]{2})*$)/
  for (;;) {
    const index = rawData.search(maxTest)
    if (index === -1) break
    subByte = nextSubstitutionByte(subByte)
    const [ match ] = rawData.match(maxTest)
    if (match.length % 2 !== 0) throw new Error('Invalid length')
    const lengthHex = new BN(65 + match.length/2).toString(16, 2)
    const opcode = `00${lengthHex}`
    maxOpcodes[subByte] = opcode
    rawData = `${rawData.slice(0, index)}${subByte}${rawData.slice(index+match.length)}`
  }

  // look for addresses, then replace them with a marker
  // then during iteration below insert the opcode logic
  // returns de-duplicated addresses
  const addresses = findAddresses(rawData)
    .filter(a => {
      if (options.addressSubs['*']) {
        // check to make sure it's address-ey
        if (a.split('').filter(c => c === '0').length > 5) {
          return false
        } else {
          return true
        }
      } else {
        return options.addressSubs[a]
      }
    })

  const addressOpcodes = {}
  for (const a of addresses) {
    const id = options.addressSubs[a] || options.addressSubs['*']
    subByte = nextSubstitutionByte(subByte)
    // re-pad it and insert a marker
    let opcode
    if (id < 2**8) {
      // 1 byte
      const op = new BN(110).toString(16, 2)
      const subhex = new BN(id).toString(16, 2)
      opcode = `00${op}${subhex}`
    } else if (id < 2**16) {
      // 2 bytes
      const op = new BN(111).toString(16, 2)
      const subhex = new BN(id).toString(16, 4)
      opcode = `00${op}${subhex}`
    } else if (id < 2**24) {
      // 3 bytes
      const op = new BN(112).toString(16, 2)
      const subhex = new BN(id).toString(16, 6)
      opcode = `00${op}${subhex}`
    } else if (id < 2**32) {
      // 4 bytes
      const op = new BN(113).toString(16, 2)
      const subhex = new BN(id).toString(16, 8)
      opcode = `00${op}${subhex}`
    } else if (id < 2**40) {
      // 5 bytes
      const op = new BN(114).toString(16, 2)
      const subhex = new BN(id).toString(16, 10)
      opcode = `00${op}${subhex}`
    } else {
      throw new Error('Address sub number is out of range')
    }
    // leading 00 to indicate an opcode
    // opcode 02 indicating address replacement
    // 3 bytes indicating the address id
    addressOpcodes[subByte] = opcode
    const fullAddress = `000000000000000000000000${a.replace('0x', '')}`
    rawData = rawData.replace(new RegExp(fullAddress, 'g'), subByte)
  }

  const bestSaving = findBestZeroRepeat(rawData)
  let offset = 0
  const zeroSubByte = subByte = nextSubstitutionByte(subByte)
  const zeroSubLength = new BN(bestSaving.length/2).toString(16, 2)
  for (;;) {
    if (bestSaving.length === 0) break
    const index = rawData.indexOf(bestSaving, offset)
    if (index === -1) break
    if (index % 2 === 1) {
      offset = index + 1
      if (rawData.indexOf(bestSaving, offset) !== offset) continue
      rawData = `${rawData.slice(0, index+1)}${zeroSubByte}${rawData.slice(index + 1 + bestSaving.length)}`
    } else rawData = `${rawData.slice(0, index)}${zeroSubByte}${rawData.slice(index + bestSaving.length)}`
  }

  // now do 0 subs if needed
  // https://stackoverflow.com/questions/31147478/regex-that-only-matches-on-odd-even-indices
  const zeroOpcodes = {}
  const zeroTest = /(00){24,64}(?=(?:[\da-zA-Z]{2})*$)/
  for (;;) {
    const index = rawData.search(zeroTest)
    if (index === -1) break
    subByte = nextSubstitutionByte(subByte)
    const [ match ] = rawData.match(zeroTest)
    if (match.length % 2 !== 0) throw new Error('Invalid length')
    const lengthHex = new BN(match.length/2).toString(16, 2)
    const opcode = `00${lengthHex}`
    zeroOpcodes[subByte] = opcode
    rawData = `${rawData.slice(0, index)}${subByte}${rawData.slice(index+match.length)}`
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
    } else if (zeroSubByte === byte) {
      uniqueBytes.push('0000')
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
    chunks.push(...chunkString(`${finalData.slice(0, -2)}${fillData}${zeroSubLength}`, 64))
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

// accepts a structure function call for `data` (4 byte sig, 32 byte args)
function findAddresses(data) {
  const args = data.replace('0x', '').slice(8)
  // now check every 32 byte value to see if it's an address (12 leading 0 bytes)
  const addressRegex = /(0{24}[a-fA-F0-9]{40})(?=(?:[\da-zA-Z]{2})*$)/
  const _addresses = data.match(addressRegex)
  if (_addresses === null) return []
  const addresses = _addresses.map(a => `0x${a.slice(24)}`)
  const dupes = {}
  // dedupe
  return addresses.filter(a => {
    if (dupes[a]) return false
    dupes[a] = true
    return true
  })
}

function findBestZeroRepeat(data) {
  let longest = 0
  // let bestSavings = 0
  let repeat = ''
  for (let x = 6; x < 255; x+=2) {
    const repeats = findRepeats(data, x)
    if (Object.keys(repeats).length === 0) break
    for (const k of Object.keys(repeats)) {
      if (!/^0+$/.test(k)) {
        continue
      }
      const cost = gasCost(k)
      const savings = cost * repeats[k] - (repeats[k]*16 + 8 + 16)
      // take the longest and rely on fixed zero subs for shorter values
      if (k.length > longest) {
        longest = k.length
        repeat = k
      }
      // continue
      // if (savings > bestSavings) {
      //   bestSavings = savings
      //   repeat = k
      // }
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
