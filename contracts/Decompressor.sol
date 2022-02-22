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
    bytes memory b = new bytes(32);
    assembly {
      calldatacopy(add(b, 32), 4, 32)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[2] calldata) public {
    bytes memory b = new bytes(64);
    assembly {
      calldatacopy(add(b, 32), 4, 64)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[3] calldata) public {
    bytes memory b = new bytes(96);
    assembly {
      calldatacopy(add(b, 32), 4, 96)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[4] calldata) public {
    bytes memory b = new bytes(128);
    assembly {
      calldatacopy(add(b, 32), 4, 128)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[5] calldata) public {
    bytes memory b = new bytes(160);
    assembly {
      calldatacopy(add(b, 32), 4, 160)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[6] calldata) public {
    bytes memory b = new bytes(192);
    assembly {
      calldatacopy(add(b, 32), 4, 192)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[7] calldata) public {
    bytes memory b = new bytes(224);
    assembly {
      calldatacopy(add(b, 32), 4, 224)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[8] calldata) public {
    bytes memory b = new bytes(256);
    assembly {
      calldatacopy(add(b, 32), 4, 256)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[9] calldata) public {
    bytes memory b = new bytes(288);
    assembly {
      calldatacopy(add(b, 32), 4, 288)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[10] calldata) public {
    bytes memory b = new bytes(320);
    assembly {
      calldatacopy(add(b, 32), 4, 320)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[11] calldata) public {
    bytes memory b = new bytes(352);
    assembly {
      calldatacopy(add(b, 32), 4, 352)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[12] calldata) public {
    bytes memory b = new bytes(384);
    assembly {
      calldatacopy(add(b, 32), 4, 384)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[13] calldata) public {
    bytes memory b = new bytes(416);
    assembly {
      calldatacopy(add(b, 32), 4, 416)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[14] calldata) public {
    bytes memory b = new bytes(448);
    assembly {
      calldatacopy(add(b, 32), 4, 448)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[15] calldata) public {
    bytes memory b = new bytes(480);
    assembly {
      calldatacopy(add(b, 32), 4, 480)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[16] calldata) public {
    bytes memory b = new bytes(512);
    assembly {
      calldatacopy(add(b, 32), 4, 512)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[17] calldata) public {
    bytes memory b = new bytes(544);
    assembly {
      calldatacopy(add(b, 32), 4, 544)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[18] calldata) public {
    bytes memory b = new bytes(576);
    assembly {
      calldatacopy(add(b, 32), 4, 576)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[19] calldata) public {
    bytes memory b = new bytes(608);
    assembly {
      calldatacopy(add(b, 32), 4, 608)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[20] calldata) public {
    bytes memory b = new bytes(640);
    assembly {
      calldatacopy(add(b, 32), 4, 640)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[21] calldata) public {
    bytes memory b = new bytes(672);
    assembly {
      calldatacopy(add(b, 32), 4, 672)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[22] calldata) public {
    bytes memory b = new bytes(704);
    assembly {
      calldatacopy(add(b, 32), 4, 704)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[23] calldata) public {
    bytes memory b = new bytes(736);
    assembly {
      calldatacopy(add(b, 32), 4, 736)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[24] calldata) public {
    bytes memory b = new bytes(768);
    assembly {
      calldatacopy(add(b, 32), 4, 768)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[25] calldata) public {
    bytes memory b = new bytes(800);
    assembly {
      calldatacopy(add(b, 32), 4, 800)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[26] calldata) public {
    bytes memory b = new bytes(832);
    assembly {
      calldatacopy(add(b, 32), 4, 832)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[27] calldata) public {
    bytes memory b = new bytes(864);
    assembly {
      calldatacopy(add(b, 32), 4, 864)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[28] calldata) public {
    bytes memory b = new bytes(896);
    assembly {
      calldatacopy(add(b, 32), 4, 896)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[29] calldata) public {
    bytes memory b = new bytes(928);
    assembly {
      calldatacopy(add(b, 32), 4, 928)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[30] calldata) public {
    bytes memory b = new bytes(960);
    assembly {
      calldatacopy(add(b, 32), 4, 960)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[31] calldata) public {
    bytes memory b = new bytes(992);
    assembly {
      calldatacopy(add(b, 32), 4, 992)
    }
    decompressSingleBitCall(b);
  }
  function decompress(bytes32[32] calldata) public {
    bytes memory b = new bytes(1024);
    assembly {
      calldatacopy(add(b, 32), 4, 1024)
    }
    decompressSingleBitCall(b);
  }
}
