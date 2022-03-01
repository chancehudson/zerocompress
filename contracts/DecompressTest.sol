/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import { Decompress } from "./Decompress.sol";

contract DecompressTest is Decompress {
  function bindAddressExact(address a, uint40 id) public {
    require(id > latestId);
    latestId = id;
    addressById[id] = a;
    idByAddress[a] = id;
  }
}
