/// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "./Decompressor.sol";

interface UniswapPool {
  function mint(
    address recipient,
    int24 tickLower,
    int24 tickUpper,
    uint128 amount,
    bytes calldata data
  ) external returns (uint256 amount0, uint256 amount1);
  function collect(
    address recipient,
    int24 tickLower,
    int24 tickUpper,
    uint128 amount0Requested,
    uint128 amount1Requested
  ) external returns (uint128 amount0, uint128 amount1);
  function swap(
    address recipient,
    bool zeroForOne,
    int256 amountSpecified,
    uint160 sqrtPriceLimitX96,
    bytes calldata data
  ) external returns (int256 amount0, int256 amount1);
}

contract UniswapTest is Decompressor {
  // DAI/WETH
  address public constant pool = 0xC7D1bd264b4FEf6a1fFf8B86bf67c7CE037f3e8A;
  address public constant dai = 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1;
  address public constant weth = 0xbC6F6b680bc61e30dB47721c6D1c5cde19C1300d;
  uint x;

  constructor(address d) Decompressor(d) {}

  function uniswapV3MintCallback(uint, uint, bytes memory) public pure {}
  function uniswapV3SwapCallback(int256, int256, bytes memory) public pure {}

  function mint(
    address recipient,
    int24 tickLower,
    int24 tickUpper,
    uint128 amount,
    bytes calldata data
  ) public {
    UniswapPool(pool).mint(recipient, tickLower, tickUpper, amount, data);
  }

  function swap(
    address,
    bool,
    int256,
    uint160,
    bytes calldata
  ) public {
    /* UniswapPool(pool).swap(recipient, zeroForOne, amountSpecified, sqrtPriceLimitX96, data); */
    require(true);
    x++;
  }
}
