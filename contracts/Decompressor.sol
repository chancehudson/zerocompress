/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "./Decompress.sol";

contract Decompressor {
  function callMethod(uint8 method, bytes memory data) internal virtual {
    if (method == type(uint8).max - 1) {
      // decompressSingleBitCall
      decompressSingleBitCall(data);
    } else if (method == type(uint8).max) {
      // decompressDoubleBitCall
      decompressDoubleBitCall(data);
    } else {
      revert('unknown method');
    }
  }

  /**
   * Decompress and pass the data to callMethod
   **/
  function decompressSingleBitCall(
    bytes memory data
  ) public {
    bytes memory finalData = Decompress.singleBit(data);
    (uint8 method, bytes memory d) = unwrap(finalData);
    callMethod(method, d);
  }

  /**
   * Decompress double bit encoding and pass the data to callMethod
   **/
  function decompressDoubleBitCall(
    bytes memory data
  ) public {
    bytes memory finalData = Decompress.doubleBitZero(data);
    (uint8 method, bytes memory d) = unwrap(finalData);
    callMethod(method, d);
  }

  // unwrap the method id from the data
  function unwrap(bytes memory d) internal pure returns (uint8, bytes memory) {
    bytes memory b = new bytes(d.length - 1);
    /* uint24 receiver = uint24(uint8(d[0]) * 2 ** 16) + uint24(uint8(d[1]) * 2 ** 8) + uint24(uint8(d[2])); */
    uint8 method = uint8(d[0]);
    uint words = (d.length - 1) / 32;
    uint remaining = (d.length - 1) % 32;
    bytes32 w;
    for (uint x; x < words; x++) {
      assembly {
        w := mload(add(add(d, 33), mul(32, x)))
        mstore(add(b, add(32, mul(x, 32))), w)
      }
    }
    uint start = 1 + words * 32;
    for (uint x = start; x < start + remaining; x++) {
      b[x - 1] = d[x];
    }
    return (method, b);
  }

  function decompress1(bytes32[1] calldata data) public {
    bytes memory b = new bytes(32);
    for (uint8 x; x < 32; x++) {
      b[x] = data[0][x];
    }
    decompressSingleBitCall(b);
  }

  function decompress2(bytes32[2] calldata data) public {
    bytes memory b = new bytes(2 * 32);
    for (uint8 x; x < 2; x++) {
      bytes32 w = data[x];
      assembly {
        mstore(add(b, add(32, mul(x, 32))), w)
      }
    }
    decompressSingleBitCall(b);
  }

  function decompress3(bytes32[3] calldata data) public {
    bytes memory b = new bytes(3 * 32);
    for (uint8 x; x < 3; x++) {
      bytes32 w = data[x];
      assembly {
        mstore(add(b, add(32, mul(x, 32))), w)
      }
    }
    decompressSingleBitCall(b);
  }

  function decompress11(bytes32[11] calldata data) public {
    bytes memory b = new bytes(11 * 32);
    for (uint8 x; x < 11; x++) {
      bytes32 w = data[x];
      assembly {
        mstore(add(b, add(32, mul(x, 32))), w)
      }
    }
    decompressSingleBitCall(b);
  }
}
