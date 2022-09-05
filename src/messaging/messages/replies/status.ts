import { Sync } from "../../../types/eth";

// hardware status
export class SystemStatus {
  constructor(
    readonly temp: number,
    readonly cpu: number
  ){}
}

export class BlockchainStatus {
  constructor(
    readonly current_block: {
      number: number;
      timestamp: number;
    },
    readonly syncing: boolean | Sync
  ){}
}

// MessageStatus
export class ReplyStatus {
  constructor(
    readonly system: SystemStatus,
    readonly blockchain: BlockchainStatus
  ){ }
}
