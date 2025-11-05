"use client";

import { RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useChainStore } from "@/stores/chain-store";
import { useMultisigStore } from "@/stores/multisig-store";

interface MultisigSidebarProps {
  onRefresh?: () => void;
  loading?: boolean;
}

export function MultisigSidebar({ onRefresh, loading }: MultisigSidebarProps) {
  const { multisigs, selectedMultisigKey, selectMultisig } = useMultisigStore();
  const { chains } = useChainStore();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Multisigs</h2>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          {multisigs.length === 0 && (
            <Card className="p-4">
              <p className="text-muted-foreground text-center text-sm">
                No multisigs available
              </p>
            </Card>
          )}

          {multisigs.map((multisig) => {
            const isSelected =
              selectedMultisigKey === multisig.publicKey.toString();

            return (
              <button
                key={multisig.publicKey.toString()}
                onClick={() => selectMultisig(multisig.publicKey.toString())}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                )}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {multisig.label || "Unnamed"}
                    </p>
                    <p className="text-muted-foreground truncate font-mono text-xs">
                      {multisig.publicKey.toString().slice(0, 6)}...
                      {multisig.publicKey.toString().slice(-4)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {multisig.threshold}/{multisig.members.length}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {chains.find((c) => c.id === multisig.chainId)?.name ||
                    multisig.chainId}
                </Badge>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
