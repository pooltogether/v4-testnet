export const external = {
  contracts: [
    {
      artifacts: "node_modules/@pooltogether/pooltogether-rng-contracts/build",
    },
    {
      artifacts: "node_modules/@pooltogether/yield-source-interface/artifacts"
    }
  ],
  deployments: {
    rinkeby: ["node_modules/@pooltogether/pooltogether-rng-contracts/deployments/rinkeby"],
    mumbai: ["node_modules/@pooltogether/pooltogether-rng-contracts/deployments/mumbai_80001"],
  }
}
export const dependencyCompiler = {
  paths: [
    // Core
    "@pooltogether/v4-core/contracts/DrawBeacon.sol",
    "@pooltogether/v4-core/contracts/DrawCalculator.sol",
    "@pooltogether/v4-core/contracts/DrawBuffer.sol",
    "@pooltogether/v4-core/contracts/PrizeDistributor.sol",
    "@pooltogether/v4-core/contracts/PrizeDistributionBuffer.sol",
    "@pooltogether/v4-core/contracts/Ticket.sol",
    "@pooltogether/v4-core/contracts/prize-strategy/PrizeSplitStrategy.sol",
    "@pooltogether/v4-core/contracts/Reserve.sol",
    "@pooltogether/v4-core/contracts/prize-pool/YieldSourcePrizePool.sol",
    "@pooltogether/v4-core/contracts/test/ERC20Mintable.sol",
    "@pooltogether/v4-core/contracts/permit/EIP2612PermitAndDeposit.sol",
    // Timelock
    "@pooltogether/v4-timelocks/contracts/L1TimelockTrigger.sol",
    "@pooltogether/v4-timelocks/contracts/L2TimelockTrigger.sol",
    "@pooltogether/v4-timelocks/contracts/DrawCalculatorTimelock.sol",
    "@pooltogether/v4-timelocks/contracts/BeaconTimelockTrigger.sol",
    "@pooltogether/v4-timelocks/contracts/ReceiverTimelockTrigger.sol",
    // Periphery
    "@pooltogether/v4-periphery/contracts/PrizeFlush.sol",
    "@pooltogether/v4-periphery/contracts/PrizeTierHistory.sol",
    "@pooltogether/v4-periphery/contracts/PrizeDistributionFactory.sol",
    "@pooltogether/v4-periphery/contracts/TwabRewards.sol",
    // mock yield source
    "@pooltogether/yield-source-interface/contracts/test/MockYieldSource.sol"

  ]
}