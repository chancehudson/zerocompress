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

    // take a 16 bit uint off the front of the data
    uint24 dataLength = uint24(uint8(data[0]) * 2 ** 8) + uint24(uint8(data[1]));
    // then a 16 bit uint after that
    uint16 finalLength = uint16(uint16(uint8(data[2])) * 2 ** 8) + uint16(uint8(data[3]));
    uint48 uniqueStart = 4 + dataLength;
    bytes memory finalData = new bytes(finalLength);

    uint48 latestUnique = 0;
    // 1 bits per item
    // do an AND then shift
    // start at a 5 byte offset
    uint8 offset = 4;
    /* uint24 finalDataOffset = 0; */
    uint48 zeroOffset = 0;
    for (uint48 x = offset; x < dataLength + offset; x++) {
      // all zeroes in this byte, skip it
      if (uint8(data[x]) == 0) {
        zeroOffset += 8;
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
          zeroOffset++;
          continue;
        }
        assert(thisVal == 1);
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
      // insert 0's
      uint8 count = uint8(uniqueData[uniqueData.length - 1]);
      return (2, count);
    } else if (opcode == uint8(2)) {
      // address replacement
      uint24 id = uint24(
        uint8(uniqueData[uniqueOffset+2]) * 2 ** 16) + uint24(uint8(uniqueData[uniqueOffset+3]) * 2 ** 8) + uint24(uint8(uniqueData[uniqueOffset+4])
      );
      address a = addressById[id];
      require(a != address(0), 'address not set');
      copyData(
        bytes32ToBytes(bytes32(bytes20(a))),
        finalData,
        finalOffset
      );
      return (5, 32);
    } else if (opcode >= 16 && opcode <= 64) {
      // insert `opcode` number of 0 bytes
      return (2, opcode);
    } else if (opcode >= 65 && opcode <= 109) {
      // insert 0xff bytes
      uint8 length = opcode - 65;
      for (uint8 x; x < length; x++) {
        finalData[finalOffset+x] = bytes1(0xff);
      }
      return (2, length);
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

  function doubleBitZero(
    bytes memory data
  ) public pure returns (bytes memory) {
    uint8[4] memory masks;
    // 11000000 = 3
    // 00110000 = 12
    // 00001100 = 48
    // 00000011 = 192
    masks[0] = 3;
    masks[1] = 12;
    masks[2] = 48;
    masks[3] = 192;

    // take a 24 bit uint off the front of the data
    uint24 dataLength = uint24(uint8(data[0]) * 2 ** 16) + uint24(uint8(data[1]) * 2 ** 8) + uint24(uint8(data[2]));
    // then a 16 bit uint after that
    uint16 finalLength = uint16(uint16(uint8(data[3])) * 2 ** 8) + uint16(uint8(data[4]));
    uint48 uniqueStart = 5 + dataLength;

    uint8[2] memory zeroCounts;
    zeroCounts[0] = uint8(data[data.length - 2]);
    zeroCounts[1] = uint8(data[data.length - 1]);

    bytes memory finalData = new bytes(finalLength);
    uint48 latestUnique = 0;
    // 1 bits per item
    // do an AND then shift
    // start at a 3 byte offset
    uint48 zeroOffset = 0;
    for (uint48 x = 5; x < dataLength + 5; x++) {
      // all zeroes in this byte, skip it
      if (uint8(data[x]) == 0) continue;
      for (uint8 y; y < 4; y++) {
        // take the current bit and convert it to a uint8
        // use exponentiation to bit shift
        if (zeroOffset >= finalLength) return finalData;
        uint8 thisVal = uint8(data[x] & bytes1(masks[y])) / uint8(2) ** (y*2);
        // if non-zero add the unique value
        if (thisVal == 0) {
          zeroOffset++;
        } else if (thisVal == 1) {
          finalData[zeroOffset++] = data[uniqueStart + latestUnique++];
        } else if (thisVal == 2) {
          zeroOffset += zeroCounts[0];
        } else if (thisVal == 3) {
          zeroOffset += zeroCounts[1];
        }
      }
    }
    return finalData;
  }

  function bytes32ToBytes(bytes32 input) internal pure returns (bytes memory) {
    bytes memory b = new bytes(32);
    assembly {
      mstore(add(b, 32), input) // set the bytes data
    }
    return b;
  }
}
