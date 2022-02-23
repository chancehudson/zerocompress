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

  /**
   * Auto generated specific length calldata functions
   * Avoids the 32 byte prefix of a `bytes` argument
   *
   * See scripts/generateBytesFunctions.js
   **/
  function decompress(bytes32[1] calldata) public {
    bytes memory b = new bytes(31);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 31)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[2] calldata) public {
    bytes memory b = new bytes(63);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 63)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[3] calldata) public {
    bytes memory b = new bytes(95);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 95)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[4] calldata) public {
    bytes memory b = new bytes(127);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 127)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[5] calldata) public {
    bytes memory b = new bytes(159);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 159)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[6] calldata) public {
    bytes memory b = new bytes(191);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 191)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[7] calldata) public {
    bytes memory b = new bytes(223);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 223)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[8] calldata) public {
    bytes memory b = new bytes(255);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 255)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[9] calldata) public {
    bytes memory b = new bytes(287);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 287)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[10] calldata) public {
    bytes memory b = new bytes(319);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 319)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[11] calldata) public {
    bytes memory b = new bytes(351);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 351)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[12] calldata) public {
    bytes memory b = new bytes(383);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 383)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[13] calldata) public {
    bytes memory b = new bytes(415);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 415)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[14] calldata) public {
    bytes memory b = new bytes(447);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 447)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[15] calldata) public {
    bytes memory b = new bytes(479);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 479)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[16] calldata) public {
    bytes memory b = new bytes(511);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 511)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[17] calldata) public {
    bytes memory b = new bytes(543);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 543)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[18] calldata) public {
    bytes memory b = new bytes(575);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 575)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[19] calldata) public {
    bytes memory b = new bytes(607);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 607)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[20] calldata) public {
    bytes memory b = new bytes(639);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 639)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[21] calldata) public {
    bytes memory b = new bytes(671);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 671)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[22] calldata) public {
    bytes memory b = new bytes(703);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 703)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[23] calldata) public {
    bytes memory b = new bytes(735);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 735)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[24] calldata) public {
    bytes memory b = new bytes(767);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 767)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[25] calldata) public {
    bytes memory b = new bytes(799);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 799)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[26] calldata) public {
    bytes memory b = new bytes(831);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 831)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[27] calldata) public {
    bytes memory b = new bytes(863);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 863)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[28] calldata) public {
    bytes memory b = new bytes(895);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 895)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[29] calldata) public {
    bytes memory b = new bytes(927);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 927)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[30] calldata) public {
    bytes memory b = new bytes(959);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 959)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[31] calldata) public {
    bytes memory b = new bytes(991);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 991)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }
  function decompress(bytes32[32] calldata) public {
    bytes memory b = new bytes(1023);
    bytes1[1] memory t;
    assembly {
      calldatacopy(t, 4, 1)
      calldatacopy(add(b, 32), 5, 1023)
    }
    if (uint8(t[0]) == uint8(0)) {
      decompressSingleBitCall(b);
    } else if (uint8(t[0]) == uint8(1)) {
      decompressDoubleBitCall(b);
    }
  }

}
