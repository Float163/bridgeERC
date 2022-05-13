import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import * as conf from "../config";

let owner : SignerWithAddress;
let addr1 : SignerWithAddress;

async function main() {
  [owner, addr1] = await ethers.getSigners();
  const fBridge = await ethers.getContractFactory("bridgeERC");
  const bridge = await fBridge.deploy(conf.VALIDATOR_ADDR);

  await bridge.deployed();

  console.log("Bridge deployed to:", bridge.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
