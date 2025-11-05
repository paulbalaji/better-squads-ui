"use client";

import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";
import { useChainStore } from "@/stores/chain-store";
import { useMultisigStore } from "@/stores/multisig-store";

import { WalletAdapterProvider } from "./wallet-adapter-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const initializeChains = useChainStore((state) => state.initializeChains);
  const initializeMultisigs = useMultisigStore(
    (state) => state.initializeMultisigs
  );

  useEffect(() => {
    initializeChains();
    initializeMultisigs();
  }, [initializeChains, initializeMultisigs]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WalletAdapterProvider>
        {children}
        <Toaster />
      </WalletAdapterProvider>
    </ThemeProvider>
  );
}
