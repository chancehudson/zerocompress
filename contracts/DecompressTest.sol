/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import { Decompress } from "./Decompress.sol";

contract DecompressTest is Decompress {
  function bindAddressExact(address a, uint40 id) public {
    require(id > latestAddressId);
    latestAddressId = id;
    addressById[id] = a;
    idByAddress[a] = id;
  }

  function bindPubkeyExact(uint[4] calldata p, uint40 id) public {
    require(id > latestPubkeyId);
    latestPubkeyId = id;
    pubkeyById[id] = p;
    idByPubkeyHash[pubkeyHash(p)] = id;
  }
}
