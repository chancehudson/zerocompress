/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "./Decompressor.sol";

contract Test is Decompressor {
  uint constant sum = 300;
  bool wasEqual = false;

  function callMethod(uint8 method, bytes memory data) internal override {
    if (method == uint8(0)) {
      revert('0');
    } else if (method == uint8(1)) {
      (uint v1, uint v2, bool eq) = abi.decode(data, (uint, uint, bool));
      testMethod1(v1, v2, eq);
    } else if (method == uint8(2)) {
      (bytes memory b, bytes32 h) = abi.decode(data, (bytes, bytes32));
      testMethod2(b, h);
    } else {
      super.callMethod(method, data);
    }
  }

  function testMethod1(uint v1, uint v2, bool eq) public {
    require((v1 == v2) == eq, 't1');
    require(v1+v2 == sum, 't2');
    wasEqual = v1 == v2; // just to suppress the state mutability warning
  }

  function testMethod2(bytes memory b, bytes32 h) public {
    require(keccak256(b) == h);
    wasEqual = !wasEqual; // just to suppress the state mutability warning
  }
}
