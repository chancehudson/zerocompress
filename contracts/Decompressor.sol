/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "./Decompress.sol";

contract Decompressor {
  /**
   * Decompress and delegatecall self so msg.sender is preserved
   **/
  function decompressSingleBitCall(
    bytes memory data
  ) public {
    bytes memory finalData = Decompress.singleBit(data);
    (bool status,) = address(this).delegatecall(finalData);
    require(status);
  }

  /**
   * Decompress double bit encoding and delegatecall self so msg.sender is
   * preserved
   **/
  function decompressDoubleBitCall(
    bytes memory data
  ) public {
    bytes memory finalData = Decompress.doubleBitZero(data);
    (bool status,) = address(this).delegatecall(finalData);
    require(status);
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
