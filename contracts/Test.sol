/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "./interfaces/IDecompressReceiver.sol";

contract Test is IDecompressReceiver {
  uint sum = 300;
  bool wasEqual = false;


  function callMethod(uint8 method, bytes memory data) external override {
    if (method == uint8(0)) {
      revert('0');
    } else if (method == uint8(1)) {
      (uint v1, uint v2, bool eq) = abi.decode(data, (uint, uint, bool));
      this.testMethod1(v1, v2, eq);
    } else if (method == uint8(2)) {
      (bytes memory b) = abi.decode(data, (bytes));
      this.testMethod2(b);
    } else {
      revert('unknown');
    }
  }

  function testMethod1(uint v1, uint v2, bool eq) public {
    require((v1 == v2) == eq, 't1');
    require(v1+v2 == sum, 't2');
    wasEqual = v1 == v2;
  }

  function testMethod2(bytes calldata b) public {
    uint _sum;
    for (uint x; x < b.length; x++) {
      _sum += uint8(b[x]);
    }
    sum = _sum;
  }
}
