"use client";

import { Network } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChainStore } from "@/stores/chain-store";

export function ChainSelector() {
  const { chains, selectedChainId, selectChain } = useChainStore();

  return (
    <Select value={selectedChainId || undefined} onValueChange={selectChain}>
      <SelectTrigger className="w-[170px]">
        <Network className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Select chain" />
      </SelectTrigger>
      <SelectContent>
        {chains.map((chain) => (
          <SelectItem key={chain.id} value={chain.id}>
            {chain.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
