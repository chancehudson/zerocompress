
;(async () => {
  const Decompress = await ethers.getContractFactory('Decompress')
  const decompress = await Decompress.deploy()
  await decompress.deployed()

  console.log(`Decompress deployed at ${decompress.address}`)
})()
