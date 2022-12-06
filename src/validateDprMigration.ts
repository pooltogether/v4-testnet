import * as hre from 'hardhat';
import { dim, green, yellow } from './colors';

const validateDprMigration = async () => {
  const { ethers, getNamedAccounts } = hre;
  const { getContract } = ethers;
  const network = hre.network.name;
  dim(`Network : ${network}`);

  const { defenderRelayer, executiveTeam } = await getNamedAccounts();

  const pdb = await getContract('PrizeDistributionBuffer');
  const pd = await getContract('PrizeDistributor');
  const dc = await getContract('DrawCalculator');
  const pdfV2 = await getContract('PrizeDistributionFactoryV2');
  const pthv2 = await getContract('PrizeTierHistoryV2');

  const pthv2Man = await pthv2.manager();
  const pdfv2Man = await pdfV2.manager();
  const pdbMan = await pdb.manager();
  const pthv2Own = await pthv2.owner();
  const pdfv2Own = await pdfV2.owner();
  const pdDC = await pd.getDrawCalculator();

  dim(`PrizeDistributionBuffer: ${pdb.address}`);
  dim(`PrizeDistributor: ${pd.address}`);
  dim(`DrawCalculator: ${dc.address}`);
  dim(`PrizeDistributionFactoryV2: ${pdfV2.address}`);
  dim(`PrizeTierHistoryV2: ${pthv2.address}`);
  dim(`Executive Team: ${executiveTeam}`);
  dim(`Defender Relayer: ${defenderRelayer}`);
  dim('---');
  validateAndLog(`PrizeTierHistoryV2 Manager: ${pthv2Man}`, pthv2Man === executiveTeam);
  validateAndLog(`PrizeDistributionFactoryV2 Manager: ${pdfv2Man}`, pdfv2Man === defenderRelayer);
  validateAndLog(`PrizeDistributionBuffer Manager: ${pdbMan}`, pdbMan === pdfV2.address);
  dim('---');
  validateAndLog(`PrizeTierHistoryV2 Owner: ${pthv2Own}`, pthv2Own === executiveTeam);
  validateAndLog(`PrizeDistributionFactoryV2 Owner: ${pdfv2Own}`, pdfv2Own === executiveTeam);
  dim('---');
  validateAndLog(`PrizeDistributor DrawCalculator: ${pdDC}`, pdDC === dc.address);
};

const validateAndLog = (message: string, condition: boolean) => {
  if (condition) {
    green(message);
  } else {
    yellow(message);
  }
};

validateDprMigration();
