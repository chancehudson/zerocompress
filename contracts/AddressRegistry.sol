/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;

contract AddressRegistry {
  mapping (uint40 => address) public addressById;
  mapping (address => uint40) public idByAddress;
  uint40 public latestAddressId = 0;

  function bindAddress(address a) public returns (uint40 id) {
    // find the number of zeroes in the address
    uint8 zeroCount = 0;
    for (uint8 x = 0; x < 20; x++) {
      uint8 v = uint8(uint(bytes32(uint(uint160(a))) & bytes32(255 * 2**(8*x))) / 2**(8*x));
      if (v == 0) zeroCount++;
    }
    // if there are 16 or more zeroes it is more profitable to compress by the
    // standard method
    require(zeroCount < 16, 'nosav');
    // otherwise we'll store it
    require(idByAddress[a] == 0, 'dupe');
    require(latestAddressId < type(uint40).max, 'full');
    id = ++latestAddressId;
    addressById[id] = a;
    idByAddress[a] = id;
  }
}
