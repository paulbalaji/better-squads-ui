export interface ChainConfig {
  id: string;
  name: string;
  rpcUrl: string;
  squadsV4ProgramId: string;
  explorerUrl?: string;
  isDefault?: boolean;
}

// Note: Public RPC endpoints have strict rate limits and may return 403 errors.
// For production use, consider using custom RPC providers like:
// - Helius (https://helius.xyz)
// - QuickNode (https://quicknode.com)
// - Alchemy (https://alchemy.com)
// You can update RPC URLs in the Chain Management settings.

export const DEFAULT_CHAINS: ChainConfig[] = [
  {
    id: "solana-mainnet",
    name: "Solana",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    squadsV4ProgramId: "SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf",
    explorerUrl: "https://explorer.solana.com",
    isDefault: true,
  },
  {
    id: "soon-mainnet",
    name: "Soon",
    rpcUrl: "https://rpc.mainnet.soo.network/rpc",
    squadsV4ProgramId: "Hz8Zg8JYFshThnKHXSZV9XJFbyYUUKBb5NJUrxDvF8PB",
    explorerUrl: "https://explorer.soo.network",
  },
  {
    id: "eclipse-mainnet",
    name: "Eclipse",
    rpcUrl: "https://mainnetbeta-rpc.eclipse.xyz",
    squadsV4ProgramId: "eSQDSMLf3qxwHVHeTr9amVAGmZbRLY2rFdSURandt6f",
    explorerUrl: "https://explorer.eclipse.xyz",
  },
  {
    id: "sonicsvm-mainnet",
    name: "SonicSVM",
    rpcUrl: "https://api.mainnet-alpha.sonic.game",
    squadsV4ProgramId: "sqdsFBUUwbsuoLUhoWdw343Je6mvn7dGVVRYCa4wtqJ",
    explorerUrl: "https://explorer.sonic.game",
  },
  {
    id: "solaxy-mainnet",
    name: "Solaxy",
    rpcUrl: "https://mainnet.rpc.solaxy.io",
    squadsV4ProgramId: "222DRw2LbM7xztYq1efxcbfBePi6xnv27o7QBGm9bpts",
    explorerUrl: "https://explorer.solaxy.io",
  },
  {
    id: "svmbnb-mainnet",
    name: "SVM BNB",
    rpcUrl: "https://rpc.svmbnbmainnet.soo.network/rpc",
    squadsV4ProgramId: "Hz8Zg8JYFshThnKHXSZV9XJFbyYUUKBb5NJUrxDvF8PB",
    explorerUrl: "https://explorer.svmbnb.soo.network",
  },
];
