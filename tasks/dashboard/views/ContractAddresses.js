const blessed = require("blessed");
const {cyan} = require("chalk");

function ContractAddresses(contracts) {
  const box = blessed.box({
    fg: "white",
    interactive: false,
    width: "shrink",
    height: "shrink",
    content:
`
${cyan('DrawBeacon')}:\n${contracts.DrawBeacon}
${cyan('DrawHistory')}:\n${contracts.DrawHistory}
${cyan('DrawPrize')}:\n${contracts.DrawPrize}
${cyan('DrawCalculator')}:\n${contracts.DrawCalculator}
${cyan('DrawCalculator')}:\n${contracts.DrawCalculator}
${cyan('PrizeDistributionHistory')}:\n${contracts.PrizeDistributionHistory}
${cyan('Reserve')}:\n${contracts.Reserve}
${cyan('DrawCalculatorTimelock')}:\n${contracts.DrawCalculatorTimelock}
${cyan('L1TimelockTrigger')}:\n${contracts.L1TimelockTrigger}
${cyan('L2TimelockTrigger')}:\n${contracts.L2TimelockTrigger}
${cyan('PrizeFlush')}:\n${contracts.PrizeFlush}`,
  });

  return box;
}

module.exports = {
  ContractAddresses,
};
