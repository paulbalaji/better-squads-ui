import { create } from "zustand";

import { chainStorage } from "@/lib/storage";
import type { ChainConfig } from "@/types/chain";
import { DEFAULT_CHAINS } from "@/types/chain";

interface ChainStore {
  chains: ChainConfig[];
  selectedChainId: string | null;
  initializeChains: () => void;
  addChain: (chain: ChainConfig) => void;
  updateChain: (id: string, updates: Partial<ChainConfig>) => void;
  deleteChain: (id: string) => void;
  selectChain: (id: string) => void;
  getSelectedChain: () => ChainConfig | undefined;
  resetToDefaults: () => void;
}

export const useChainStore = create<ChainStore>((set, get) => ({
  chains: [],
  selectedChainId: null,

  initializeChains: () => {
    const storedChains = chainStorage.getChains();
    const selectedId = chainStorage.getSelectedChainId();

    const chains = storedChains.length > 0 ? storedChains : DEFAULT_CHAINS;

    if (storedChains.length === 0) {
      chainStorage.saveChains(DEFAULT_CHAINS);
    }

    const selectedChainId =
      selectedId || chains.find((c) => c.isDefault)?.id || chains[0]?.id;

    if (selectedChainId) {
      chainStorage.setSelectedChainId(selectedChainId);
    }

    set({ chains, selectedChainId });
  },

  addChain: (chain) => {
    chainStorage.addChain(chain);
    set((state) => ({ chains: [...state.chains, chain] }));
  },

  updateChain: (id, updates) => {
    chainStorage.updateChain(id, updates);
    const newChains = get().chains.map((chain) =>
      chain.id === id ? { ...chain, ...updates } : chain
    );
    set({ chains: newChains });
  },

  deleteChain: (id) => {
    chainStorage.deleteChain(id);
    set((state) => {
      const chains = state.chains.filter((chain) => chain.id !== id);
      const selectedChainId =
        state.selectedChainId === id
          ? chains[0]?.id || null
          : state.selectedChainId;

      if (selectedChainId) {
        chainStorage.setSelectedChainId(selectedChainId);
      }

      return { chains, selectedChainId };
    });
  },

  selectChain: (id) => {
    chainStorage.setSelectedChainId(id);
    set({ selectedChainId: id });
  },

  getSelectedChain: () => {
    const { chains, selectedChainId } = get();
    return chains.find((chain) => chain.id === selectedChainId);
  },

  resetToDefaults: () => {
    chainStorage.saveChains(DEFAULT_CHAINS);
    const selectedChainId =
      DEFAULT_CHAINS.find((c) => c.isDefault)?.id || DEFAULT_CHAINS[0]?.id;
    if (selectedChainId) {
      chainStorage.setSelectedChainId(selectedChainId);
    }
    set({ chains: DEFAULT_CHAINS, selectedChainId });
  },
}));
