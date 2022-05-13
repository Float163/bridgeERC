import * as conf from "../config";
import { task } from "hardhat/config";
//string memory _symbol, uint256 _id, uint256 _amount, address _recipient
task("swap", "Swap token")
    .addParam("symbol", "The token symbol")
    .addParam("chainID", "The cahinID")    
    .addParam("amount", "The amount token")    
    .addParam("reipient", "The recipient address")            
    .setAction(async (taskArgs, { ethers }) => {
    let hardhatToken = await ethers.getContractAt(conf.CONTRACT_NAME, conf.CONTRACT_ADDR);
    const result = await hardhatToken.createItem(taskArgs.symbol, taskArgs.chainID, taskArgs.amount, taskArgs.recipient);
    console.log(result);
  });

  
export default {
  solidity: "0.8.4"
};
