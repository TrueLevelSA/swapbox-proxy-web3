import { Sync } from "../../../types/eth";
import { ReplyBase } from "./base";

export interface SystemStatus {
  temp: number
  cpu: number
}

export interface BlockchainStatus {
  current_block: {
      number: number;
      timestamp: number;
  }
  syncing: boolean | Sync
}

export interface ReplyStatus extends ReplyBase {
  system: SystemStatus
  blockchain: BlockchainStatus
}
