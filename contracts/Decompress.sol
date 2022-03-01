/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import { AddressRegistry } from "./AddressRegistry.sol";

interface OpcodeHandler {
  function handleOpcode(
    bytes memory data,
    uint uniqueOffset,
    bytes memory finalData,
    uint finalOffset
  ) external;
}

contract Decompress is AddressRegistry {
  /**
   * A 0 bit indicates a 0 byte
   * A 1 bit indicates a unique byte
   **/
  function singleBit(
    bytes memory data
  ) public view returns (bytes memory) {
    /* uint8[8] memory masks;
    masks[0] = 1;
    masks[1] = 2;
    masks[2] = 4;
    masks[3] = 8;
    masks[4] = 16;
    masks[5] = 32;
    masks[6] = 64;
    masks[7] = 128; */

    // first byte sets arguments
    // first bit: indicates whether 0 or 1 indicates a zero byte (default 0)
    // bits 2-3: indicates length of data array
    // bits 4-5: indicates length of final array
    // bits 6-8: used for data length (if possible), bits 2-3 will be 0
    uint24 dataLength;
    uint24 finalLength;
    uint48 uniqueStart;
    uint8 offset;
    {
      // 01100000 - 6
      // bit shift once
      uint8 dataBytesLength = uint8(data[0] & bytes1(uint8(6))) / 2;
      // 00011000 - 24
      // bit shift 3 times
      uint8 finalBytesLength = uint8(data[0] & bytes1(uint8(24))) / 8;
      if (dataBytesLength == uint8(0)) {
        // maybe it's set here
        // 00000111 - 224
        // bit shift 5 times
        dataLength = uint8(data[0] & bytes1(uint8(224))) / 32;
      } else {
        // extract N bits
        for (uint8 x = dataBytesLength; x > 0; --x) {
          dataLength += uint24(uint8(data[x]) * 2 ** (8*(dataBytesLength - x)));
        }
      }
      for (uint8 x = finalBytesLength; x > 0; --x) {
        finalLength += uint24(uint8(data[x + dataBytesLength]) * 2 ** (8*(finalBytesLength - x)));
      }
      offset = dataBytesLength + finalBytesLength + 1;
      uniqueStart = offset + dataLength;
    }

    bytes memory finalData = new bytes(finalLength);

    uint48 latestUnique = 0;
    // 1 bits per item
    // do an AND then shift
    // start at a 5 byte offset
    bool lastBit = true;
    /* uint24 finalDataOffset = 0; */
    uint48 zeroOffset = 0;
    for (uint48 x = offset; x < dataLength + offset; x++) {
      // all zeroes in this byte, skip it
      if (uint8(data[x]) == 0) {
        zeroOffset += 8;
        lastBit = false;
        continue;
      }
      for (uint8 y; y < 8; y++) {
        /* uint48 index = 8*(x-offset)+y+finalDataOffset; */
        if (zeroOffset >= finalLength) return finalData;
        // take the current bit and convert it to a uint8
        // use exponentiation to bit shift
        uint8 thisVal = uint8(data[x] & bytes1(uint8(2**y))) / uint8(2**y);
        // if non-zero add the unique value
        if (thisVal == 0) {
          lastBit = false;
          zeroOffset++;
          continue;
        }
        assert(thisVal == 1);
        lastBit = true;
        if (uint8(data[uniqueStart + latestUnique]) == 0) {
          // it's an opcode
          (uint48 uniqueIncr, uint24 dataIncr) = handleOpcode(
            data,
            uniqueStart + latestUnique,
            finalData,
            zeroOffset
          );
          latestUnique += uniqueIncr;
          zeroOffset += dataIncr;
        } else {
          finalData[zeroOffset++] = data[uniqueStart + latestUnique++];
        }
      }
    }
    while (zeroOffset < finalLength) {
      if (!lastBit) break;
      if (uint8(data[uniqueStart + latestUnique]) == 0) {
        // it's an opcode
        (uint48 uniqueIncr, uint24 dataIncr) = handleOpcode(
          data,
          uniqueStart + latestUnique,
          finalData,
          zeroOffset
        );
        latestUnique += uniqueIncr;
        zeroOffset += dataIncr;
      } else {
        finalData[zeroOffset++] = data[uniqueStart + latestUnique++];
      }
    }
    return finalData;
  }

  function copyData(
    bytes memory input,
    bytes memory dest,
    uint destOffset
  ) internal pure {
    require(input.length % 32 == 0, 'non32');
    require(dest.length >= destOffset + input.length, 'long');
    for (uint x; x < input.length/32; x++) {
      assembly {
        mstore(
          add(add(add(dest, 32), destOffset), mul(x, 32)),
          mload(add(add(input, 32), mul(x, 32)))
        )
      }
    }
  }

  function handleOpcode(
    bytes memory uniqueData,
    uint uniqueOffset,
    bytes memory finalData,
    uint finalOffset
  ) internal view returns (uint48, uint24) {
    uint8 opcode = uint8(uniqueData[uniqueOffset + 1]);
    if (opcode == uint8(0)) {
      // insert 0's specified by number at end of data
      uint8 count = uint8(uniqueData[uniqueData.length - 1]);
      return (2, count);
    } else if (opcode >= 1 && opcode <= 64) {
      // insert `opcode` number of 0 bytes
      return (2, opcode);
    } else if (opcode >= 65 && opcode <= 109) {
      // insert 0xff bytes
      uint8 length = opcode - 65;
      for (uint8 x; x < length; x++) {
        finalData[finalOffset+x] = bytes1(0xff);
      }
      return (2, length);
    } else if (opcode >= 110 && opcode <= 114) {
      uint8 byteCount = (opcode - 110) + 1;
      // address replacement (N bytes)
      uint40 id;
      for (uint8 x = byteCount; x > 0; --x) {
        id += uint40(uint8(finalData[x + finalOffset]) * 2 ** (8*(byteCount - x)));
      }
      address a = addressById[id];
      require(a != address(0), 'address not set');
      copyData(
        bytes32ToBytes(bytes32(bytes20(a))),
        finalData,
        finalOffset
      );
      return (2+byteCount, 32);
    /* } else if (opcode > 170) { */
      /* (bool success, bytes memory data) = msg.sender.call(
        abi.encodeWithSignature(
          "handleOpcode(bytes,uint,bytes,uint)",
          uniqueData,
          uniqueOffset,
          finalData,
          finalOffset
        )
      );
      require(success);
      (uint48 u, uint24 d) = abi.decode(data, (uint48, uint24)); */
      /* return (u, d); */
    } else {
      revert('unknown opcode');
    }
  }

  function bytes32ToBytes(bytes32 input) internal pure returns (bytes memory) {
    bytes memory b = new bytes(32);
    assembly {
      mstore(add(b, 32), input) // set the bytes data
    }
    return b;
  }
}
