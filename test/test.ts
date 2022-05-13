// We import Chai to use its asserting functions here.
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` receives the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe("Bridge ontract", function () {
  // Mocha has four functions that let you hook into the test runner's
  // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

  // They're very useful to setup the environment for tests, and to clean it
  // up after they run.

  // A common pattern is to declare some variables, and assign them in the
  // `before` and `beforeEach` callbacks.

  let Token : ContractFactory;
  let Mp : ContractFactory;
  let TokenERC20 : ContractFactory;
 
  let bridge1 : Contract;
  let tkn1 : Contract;
  let mERC20_eth: Contract;
  let owner : SignerWithAddress;
  let validator : SignerWithAddress;
  let addr1 : SignerWithAddress;  
  let addr2 : SignerWithAddress;
  let addr3 : SignerWithAddress;

  beforeEach(async function () {
    [owner, validator, addr1, addr2, addr3 ] = await ethers.getSigners();    
    TokenERC20 = await ethers.getContractFactory("m63");    
    mERC20_eth = await TokenERC20.deploy('platinum', 'PL', 18, ethers.utils.parseEther('500'));    
    Mp = await ethers.getContractFactory("bridgeERC");
    bridge1 = await Mp.deploy(validator.address);    
//    await tkn1.setMinter(bridge1.address);
    await mERC20_eth.setMinterBurner(bridge1.address);
    await mERC20_eth.mint(addr1.address, ethers.utils.parseEther('100'));
    await bridge1.updateChainById(1, true);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await bridge1.owner()).to.equal(owner.address);
    });
  });

  describe("Transactions", function () { 
    it("Should add token to bridge ", async function () {
        await bridge1.includeToken("PL", mERC20_eth.address);
      });

    it("Should burn token from sender", async function () {
        await bridge1.includeToken("PL", mERC20_eth.address);
        await bridge1.connect(addr1).swap("PL", 1, ethers.utils.parseEther('10'), addr3.address);
        expect(await mERC20_eth.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("90"));      
      });

      it("Should emit swapInitialized", async function () {
        await bridge1.includeToken("PL", mERC20_eth.address);
        await expect(bridge1.connect(addr1).swap("PL", 1, ethers.utils.parseEther('10'), addr3.address)).to.emit(bridge1, "swapInitialized")
        .withArgs("PL", 1, ethers.utils.parseEther('10'), addr3.address, 1);
      });

      it("Should fail if token symbol incorrect", async function () {
        await bridge1.includeToken("PL", mERC20_eth.address);
        await expect(bridge1.connect(addr1).swap("PL1", 1, ethers.utils.parseEther('10'), addr3.address)).to.be.revertedWith("Unsupported token");
      });

      it("Should fail if chanID incorrect", async function () {
        await bridge1.includeToken("PL", mERC20_eth.address);
        await expect(bridge1.connect(addr1).swap("PL", 2, ethers.utils.parseEther('10'), addr3.address)).to.revertedWith("Unsupported chain ID");
      });

      it("Should fail if not enough token", async function () {
        await bridge1.includeToken("PL", mERC20_eth.address);
        await expect(bridge1.connect(addr1).swap("PL", 1, ethers.utils.parseEther('500'), addr3.address)).to.be.revertedWith("Not enough token");
      });

      it("Should redeem", async function () {
        await bridge1.includeToken("PL", mERC20_eth.address);
        await bridge1.connect(addr1).swap("PL", 1, ethers.utils.parseEther('10'), addr3.address);
        
        let msg = ethers.utils.solidityKeccak256(["address", "uint256", "string", "uint256"], [addr3.address, ethers.utils.parseEther('10'), "PL", 1]);
        let signature = await validator.signMessage(ethers.utils.arrayify(msg));

        let sig = await ethers.utils.splitSignature(signature);
//        expect(await bridge1.checkSign(addr3.address, 10, "PL", 1, sig.v, sig.r, sig.s)).to.equal(true);
        await bridge1.redeem("PL", 1, ethers.utils.parseEther('10'), addr3.address, 1, sig.v, sig.r, sig.s);
        expect(await mERC20_eth.balanceOf(addr3.address)).to.equal(ethers.utils.parseEther('10')); 
      });


    it("Should fail redeem if signature not validator", async function () {
      await bridge1.includeToken("PL", mERC20_eth.address);
      await bridge1.connect(addr1).swap("PL", 1, ethers.utils.parseEther('10'), addr3.address);
      
      let msg = ethers.utils.solidityKeccak256(["address", "uint256", "string", "uint256"], [addr3.address, ethers.utils.parseEther('10'), "PL", 1]);
      let signature = await addr1.signMessage(ethers.utils.arrayify(msg));

      let sig = await ethers.utils.splitSignature(signature);

      await expect(
        bridge1.redeem("PL", 1, ethers.utils.parseEther('10'), addr3.address, 1, sig.v, sig.r, sig.s)
      ).to.be.revertedWith("Wrong signature");
    });

    it("Should fail redeem if backend sig incorrect", async function () {
      await bridge1.includeToken("PL", mERC20_eth.address);
      await bridge1.connect(addr1).swap("PL", 1, ethers.utils.parseEther('10'), addr3.address);
      
      let msg = ethers.utils.solidityKeccak256(["address", "uint256", "string", "uint256"], [addr3.address, ethers.utils.parseEther('10'), "PL", 10]);
      let signature = await validator.signMessage(ethers.utils.arrayify(msg));

      let sig = await ethers.utils.splitSignature(signature);

      await expect(
        bridge1.redeem("PL", 1, ethers.utils.parseEther('10'), addr3.address, 1, sig.v, sig.r, sig.s)
      ).to.be.revertedWith("Wrong signature");
    });

    it("Should fail redeem if already processed", async function () {
      await bridge1.includeToken("PL", mERC20_eth.address);
      await bridge1.connect(addr1).swap("PL", 1, ethers.utils.parseEther('10'), addr3.address);
      
      let msg = ethers.utils.solidityKeccak256(["address", "uint256", "string", "uint256"], [addr3.address, ethers.utils.parseEther('10'), "PL", 1]);
      let signature = await validator.signMessage(ethers.utils.arrayify(msg));

      let sig = await ethers.utils.splitSignature(signature);

      bridge1.redeem("PL", 1, ethers.utils.parseEther('10'), addr3.address, 1, sig.v, sig.r, sig.s)

      await expect(
        bridge1.redeem("PL", 1, ethers.utils.parseEther('10'), addr3.address, 1, sig.v, sig.r, sig.s)
      ).to.be.revertedWith("Tranfer already processed");
    });

  });

});