/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;

interface IDecompressReceiver {
  function callMethod(uint8 method, bytes memory data) external;
}
