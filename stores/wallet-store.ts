import { PublicKey } from "@solana/web3.js";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { WalletState } from "@/types/wallet";

interface WalletStore extends WalletState {
  connect: (
    publicKey: WalletState["publicKey"],
    derivationPath: string,
    deviceModel?: string
  ) => void;
  disconnect: () => void;
}

interface PersistedWalletState {
  connected: boolean;
  publicKey: string | null;
  derivationPath: string;
  deviceModel?: string;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      connected: false,
      publicKey: null,
      derivationPath: "44'/501'/0'/0'",
      deviceModel: undefined,

      connect: (publicKey, derivationPath, deviceModel) => {
        set({
          connected: true,
          publicKey,
          derivationPath,
          deviceModel,
        });
      },

      disconnect: () => {
        set({
          connected: false,
          publicKey: null,
          derivationPath: "44'/501'/0'/0'",
          deviceModel: undefined,
        });
      },
    }),
    {
      name: "squad-wallet",
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const { state } = JSON.parse(str);
            const persisted = state as PersistedWalletState;
            return {
              state: {
                connected: persisted.connected,
                publicKey: persisted.publicKey
                  ? new PublicKey(persisted.publicKey)
                  : null,
                derivationPath: persisted.derivationPath,
                deviceModel: persisted.deviceModel,
              },
            };
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          const persisted: PersistedWalletState = {
            connected: value.state.connected,
            publicKey: value.state.publicKey
              ? value.state.publicKey.toString()
              : null,
            derivationPath: value.state.derivationPath,
            deviceModel: value.state.deviceModel,
          };
          localStorage.setItem(
            name,
            JSON.stringify({
              state: persisted,
              version: value.version,
            })
          );
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
