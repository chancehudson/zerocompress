/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;

contract BLSKeyRegistry {
  mapping (uint40 => uint[4]) public pubkeyById;
  mapping (bytes32 => uint40) public idByPubkeyHash;
  uint40 public latestPubkeyId = 0;

  function pubkeyHash(uint[4] calldata pubkey) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(pubkey));
  }

  function idByPubkey(uint[4] calldata pubkey) public view returns (uint40) {
    return idByPubkeyHash[pubkeyHash(pubkey)];
  }

  function bindPubkey(uint[4] calldata pubkey) public returns (uint40 id) {
    // find the number of zeroes in the pubkey
    uint8 zeroCount = 0;
    for (uint8 x = 0; x < 128; x++) {
      uint8 keyIndex = x/32;
      uint8 byteIndex = x - (32 * keyIndex);
      uint8 v = uint8(uint(bytes32(uint(pubkey[keyIndex])) & bytes32(255 * 2**(8*byteIndex))) / 2**(8*byteIndex));
      if (v == 0) zeroCount++;
    }
    // if there are 50 or more zeroes it is more profitable to compress by the
    // standard method
    require(zeroCount < 50, 'nosav');
    // otherwise we'll store it
    require(idByPubkeyHash[pubkeyHash(pubkey)] == 0, 'dupe');
    require(latestPubkeyId < type(uint40).max, 'full');
    id = ++latestPubkeyId;
    pubkeyById[id] = pubkey;
    idByPubkeyHash[pubkeyHash(pubkey)] = id;
  }
}
