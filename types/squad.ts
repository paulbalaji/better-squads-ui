import type { PublicKey } from "@solana/web3.js";

export interface SquadMember {
  key: PublicKey;
  permissions: {
    mask: number;
  };
}

export interface SquadMultisigAccount {
  threshold: number;
  members: SquadMember[];
  transactionIndex: bigint;
  msChangeIndex: number;
  programId: PublicKey;
}
