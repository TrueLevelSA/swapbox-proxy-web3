import { BigNumber } from "ethers";

export interface Sync {
  startingBlock: number;
  currentBlock: number;
  highestBlock: number;
  knownStates: number;
  pulledStated: number;
}

export function outputSyncingFormatter(result: any): Sync | boolean {
  if (typeof result == "boolean") {
    return result;
  }

  result.startingBlock = hexToNumber(result.startingBlock);
  result.currentBlock = hexToNumber(result.currentBlock);
  result.highestBlock = hexToNumber(result.highestBlock);
  if (result.knownStates) {
    result.knownStates = hexToNumber(result.knownStates);
    result.pulledStates = hexToNumber(result.pulledStates);
  }

  return result;
}

function hexToNumber(hex: string): number {
  return BigNumber.from(hex).toNumber()
}
