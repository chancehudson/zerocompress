/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;

interface IDecompressReceiver {
  struct Data {
    uint24 receiver;
    uint8 method;
    bytes data;
  }
  function callMethod(uint8 method, bytes memory data) external;
}
