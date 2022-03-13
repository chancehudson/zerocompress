/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "./Decompressor.sol";

contract Test is Decompressor {
  uint constant sum = 300;
  bool wasEqual = false;

  constructor(address d) Decompressor(d) {}

  function testMethod1(uint v1, uint v2, bool eq) public {
    require((v1 == v2) == eq, 't1');
    require(v1+v2 == sum, 't2');
    wasEqual = v1 == v2; // just to suppress the state mutability warning
  }

  function testMethod2(bytes memory b, bytes32 h) public {
    require(keccak256(b) == h);
    wasEqual = !wasEqual; // just to suppress the state mutability warning
  }

  function testMethod3(address a, bytes32 h) public {
    require(a != address(0), 'zer');
    require(keccak256(abi.encode(a)) == h, 'ne');
    wasEqual = false;
  }

  function testMethod4(uint[4] calldata p, bytes32 h) public {
    require(
      p[0] != 0 &&
      p[1] != 0 &&
      p[2] != 0 &&
      p[3] != 0,
      'zer'
    );
    require(keccak256(abi.encodePacked(p)) == h, 'ne');
    wasEqual = false;
  }
}
