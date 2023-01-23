export const DRAW_BUFFER_CARDINALITY = 255;
export const PRIZE_DISTRIBUTION_BUFFER_CARDINALITY = 180; // six months
export const PRIZE_DISTRIBUTION_FACTORY_MINIMUM_PICK_COST = 1000000; // 1 USDC

export const BEACON_START_TIME = Math.floor(new Date('2021-11-3T19:00:00.000Z').getTime() / 1000);
export const BEACON_PERIOD_SECONDS = 86400; // one day
export const END_TIMESTAMP_OFFSET = 15 * 60; // 15 minutes
export const RNG_TIMEOUT_SECONDS = 2 * 3600; // 2 hours
export const EXPIRY_DURATION = 60 * 86400; // 2 months
export const ONE_YEAR_IN_SECONDS = 31557600;

export const TOKEN_DECIMALS = 6;

export const ARBITRUM_GOERLI_CHAIN_ID = 421613;
export const FUJI_CHAIN_ID = 43113;
export const GOERLI_CHAIN_ID = 5;
export const MUMBAI_CHAIN_ID = 80001;
export const OPTIMISM_GOERLI_CHAIN_ID = 420;
