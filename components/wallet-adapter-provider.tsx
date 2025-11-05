"use client";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useMemo } from "react";

import { useChainStore } from "@/stores/chain-store";

interface WalletAdapterProviderProps {
  children: React.ReactNode;
}

export function WalletAdapterProvider({
  children,
}: WalletAdapterProviderProps) {
  const chains = useChainStore((state) => state.chains);

  const endpoint = useMemo(() => {
    const solanaMainnet = chains.find((chain) => chain.id === "solana-mainnet");
    return solanaMainnet?.rpcUrl || "https://api.mainnet-beta.solana.com";
  }, [chains]);

  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
