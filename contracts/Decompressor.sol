/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "./interfaces/IDecompressReceiver.sol";

contract Decompressor is IDecompressReceiver {

  mapping (uint24 => address) public receivers;
  mapping (address => uint24) public receiversByAddress;
  uint24 latestReceiver = 0;

  constructor() {
    registerReceiver(address(this));
  }

  function callMethod(uint8 method, bytes memory data) external override {
    if (method == uint8(0)) {
      // decompressSingleBitCall
      (bytes memory _data, bytes memory uniques) = abi.decode(data, (bytes, bytes));
      this.decompressSingleBitCall(_data, uniques);
    } else if (method == uint8(1)) {
      // decompressDoubleBitCall
      (bytes memory _data, bytes memory uniques) = abi.decode(data, (bytes, bytes));
      bytes32[2] memory b;
      this.decompressDoubleBitCall(_data, uniques, b);
    } else {
      revert('unknown method');
    }
  }

  function registerReceiver(address receiver) public {
    receiversByAddress[receiver] = latestReceiver;
    receivers[latestReceiver++] = receiver;
  }

  /**
   * Decompress and pass the data to a contract
   **/
  function decompressSingleBitCall(
    bytes memory data,
    bytes memory uniques
  ) public {
    bytes memory finalData = decompressSingleBit(data, uniques);
    (uint24 receiver, uint8 method, bytes memory d) = abi.decode(finalData, (uint24, uint8, bytes));
    require(receivers[receiver] != address(0));
    // now pass the finalData to another function
    IDecompressReceiver(receivers[receiver]).callMethod(method, d);
  }

  /**
   * Decompress double bit encoding and pass the data to a contract
   **/
  function decompressDoubleBitCall(
    bytes memory data,
    bytes memory uniques,
    bytes32[2] memory repeats
  ) public {
    bytes memory finalData = decompressDoubleBit(data, uniques, repeats);
    (uint24 receiver, uint8 method, bytes memory d) = abi.decode(finalData, (uint24, uint8, bytes));
    require(receivers[receiver] != address(0));
    // now pass the finalData to another function
    IDecompressReceiver(receivers[receiver]).callMethod(method, d);
  }

  /**
   * A 0 bit indicates a 0 byte
   * A 1 bit indicates a unique byte
   **/
  function decompressSingleBit(
    bytes memory data,
    bytes memory uniques
  ) public pure returns (bytes memory) {
    uint8[8] memory masks;
    masks[0] = 1;
    masks[1] = 2;
    masks[2] = 4;
    masks[3] = 8;
    masks[4] = 16;
    masks[5] = 32;
    masks[6] = 64;
    masks[7] = 128;
    bytes memory finalData = new bytes(data.length * 8);
    uint48 latestUnique = 0;

    // 1 bits per item
    // do an AND then shift
    for (uint48 x; x < data.length; x++) {
      // all zeroes in this byte, skip it
      if (uint8(data[x]) == 0) continue;
      for (uint8 y; y < 8; y++) {
        // take the current bit and convert it to a uint8
        // use exponentiation to bit shift
        uint8 thisVal = uint8(data[x] & bytes1(masks[y])) / masks[y];
        // if non-zero add the unique value
        if (thisVal == 1) {
          finalData[8*x+y] = uniques[latestUnique++];
        }
      }
    }
    return finalData;
  }

  /**
   * A 0 set indicates a unique entry
   * Any other values indicates a repeat entry
   *
   * bytes are big endian, integers are little endian
   **/
  function decompressDoubleBit(
    bytes memory data,
    bytes memory uniques,
    bytes32[2] memory repeats
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
    uint48 finalLength;
    // 0 is uniques, 1 is repeats
    uint8[] memory vals = new uint8[](data.length * 4);

    // 2 bits per item
    // do an AND then shift
    for (uint48 x; x < data.length; x++) {
      if (uint8(data[x]) == uint8(0)) {
        finalLength += 4;
        continue;
      }
      for (uint8 y; y < 4; y++) {
        // take the current 2 bits and convert them to a uint8
        // use exponentiation to bit shift
        uint8 thisVal = uint8(data[x] & bytes1(masks[y])) / uint8(2) ** (y*2);
        // if it's a 0 insert 8 zero bits
        // otherwise pull from the uniques or repeats array
        if (thisVal == 0) {
          finalLength += 1;
        } else {
          finalLength += 4;
          vals[4*x+y] = thisVal;
        }
      }
    }
    bytes memory finalData = new bytes(finalLength);
    uint48 latestUnique = 0;
    uint48 offset = 0;
    for (uint48 x; x < data.length; x++) {
      if (uint8(data[x]) == uint8(0)) {
        finalData[offset++] = uniques[latestUnique++];
        finalData[offset++] = uniques[latestUnique++];
        finalData[offset++] = uniques[latestUnique++];
        finalData[offset++] = uniques[latestUnique++];
        continue;
      }
      for (uint8 y; y < 4; y++) {
        // take the current 2 bits and convert them to a uint8
        // use exponentiation to bit shift
        uint8 thisVal = vals[4*x+y];
        // if it's a 0 insert 8 zero bits
        // otherwise pull from the uniques or repeats array
        if (thisVal == 0) {
          finalData[offset++] = uniques[latestUnique++];
        } else {
          for (uint8 z; z < 4; z++) {
            finalData[offset++] = repeats[thisVal][z];
          }
        }
      }
    }
    return finalData;
  }

  function bytes32ToBytes(bytes32 input) internal pure returns (bytes memory) {
    // index is every 8 bits
    bytes memory b = new bytes(32);
    assembly {
      mstore(add(b, 32), input)
    }
    return b;
  }
}
