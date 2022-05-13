import * as conf from "../config";
import { task } from "hardhat/config";
//string memory _symbol, uint256 _id, uint256 _amount, address _recipient, uint256 _nonce, uint8 v, bytes32 r, bytes32 s
task("redeem", "Redeem token")
    .addParam("symbol", "The token symbol")
    .addParam("chainID", "The cahinID")    
    .addParam("amount", "The amount token")    
    .addParam("reipient", "The recipient address")            
    .addParam("nonce", "The recipient address")                
    .addParam("v", "The recipient address")                
    .addParam("r", "The recipient address")                
    .addParam("s", "The recipient address")                            
    .setAction(async (taskArgs, { ethers }) => {
    let hardhatToken = await ethers.getContractAt(conf.CONTRACT_NAME, conf.CONTRACT_ADDR);
    const result = await hardhatToken.createItem(taskArgs.symbol, taskArgs.chainID, taskArgs.amount, taskArgs.recipient, taskArgs.nonce, taskArgs.v, taskArgs.r, taskArgs.s);
    console.log(result);
  });

  
export default {
  solidity: "0.8.4"
};
