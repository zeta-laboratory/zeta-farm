// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/FarmTreasury.sol";

/**
 * @notice 部署 FarmTreasury 合约
 * @dev 使用方法：
 * forge script script/DeployFarmTreasury.s.sol:DeployFarmTreasury --rpc-url $RPC_URL --broadcast --verify
 */
contract DeployFarmTreasury is Script {
    function run() external {
        // 从环境变量读取配置
        address backendSigner = vm.envAddress("BACKEND_SIGNER_ADDRESS");
        address prizePoolAddress = vm.envAddress("PRIZE_POOL_ADDRESS");
        address communityAddress = vm.envAddress("COMMUNITY_ADDRESS");
        
        // 获取部署者私钥
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console.log("Deploying FarmTreasury...");
        console.log("Backend Signer:", backendSigner);
        console.log("Prize Pool Address:", prizePoolAddress);
        console.log("Community Address:", communityAddress);
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        vm.startBroadcast(deployerPrivateKey);

        // 部署合约
        FarmTreasury farmTreasury = new FarmTreasury(
            backendSigner,
            prizePoolAddress,
            communityAddress
        );

        vm.stopBroadcast();

        console.log("FarmTreasury deployed at:", address(farmTreasury));
        console.log("Backend signer:", farmTreasury.backendSigner());
        console.log("Prize pool address:", farmTreasury.prizePoolAddress());
        console.log("Community address:", farmTreasury.communityAddress());
        console.log("Owner:", farmTreasury.owner());
        console.log("Action fee:", farmTreasury.ACTION_FEE());
    }
}
