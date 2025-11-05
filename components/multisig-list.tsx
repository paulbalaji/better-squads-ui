"use client";

import { PublicKey } from "@solana/web3.js";
import { Loader2, Pencil, RefreshCw, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SquadService } from "@/lib/squad";
import { useChainStore } from "@/stores/chain-store";
import { useMultisigStore } from "@/stores/multisig-store";
import { useWalletStore } from "@/stores/wallet-store";
import type { SquadMember } from "@/types/squad";

export function MultisigList() {
  const [loading, setLoading] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(
    new Set()
  );
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const { publicKey } = useWalletStore();
  const { getSelectedChain, chains } = useChainStore();
  const { multisigs, setMultisigs, deleteMultisig, updateMultisigLabel } =
    useMultisigStore();

  const loadMultisigs = useCallback(async () => {
    if (!publicKey) return;

    const chain = getSelectedChain();
    if (!chain) return;

    setLoading(true);
    try {
      const squadService = new SquadService(
        chain.rpcUrl,
        chain.squadsV4ProgramId
      );

      const accounts = await squadService.getMultisigsByCreator(publicKey);

      const loadedMultisigs = accounts.map((acc) => ({
        publicKey: acc.publicKey,
        threshold: acc.account.threshold,
        members: acc.account.members.map((m: SquadMember) => ({
          key: m.key,
          permissions: { mask: m.permissions.mask },
        })),
        transactionIndex: BigInt(acc.account.transactionIndex.toString()),
        msChangeIndex: 0,
        programId: new PublicKey(chain.squadsV4ProgramId),
        chainId: chain.id,
      }));

      // Merge with existing stored multisigs
      const existingKeys = new Set(
        loadedMultisigs.map((m) => m.publicKey.toString())
      );

      setMultisigs((currentMultisigs) => {
        const storedMultisigs = currentMultisigs.filter(
          (m) => !existingKeys.has(m.publicKey.toString())
        );
        return [...storedMultisigs, ...loadedMultisigs];
      });
    } catch (error) {
      console.error("Failed to load multisigs:", error);
      toast.error("Failed to load multisigs");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  useEffect(() => {
    loadMultisigs();
  }, [loadMultisigs]);

  const toggleSelect = (publicKey: string) => {
    setSelectedForDeletion((prev) => {
      const next = new Set(prev);
      if (next.has(publicKey)) {
        next.delete(publicKey);
      } else {
        next.add(publicKey);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedForDeletion.size === multisigs.length) {
      setSelectedForDeletion(new Set());
    } else {
      setSelectedForDeletion(
        new Set(multisigs.map((m) => m.publicKey.toString()))
      );
    }
  };

  const handleDeleteSelected = () => {
    if (selectedForDeletion.size === 0) return;

    if (
      confirm(
        `Are you sure you want to remove ${selectedForDeletion.size} multisig(s) from your list?`
      )
    ) {
      selectedForDeletion.forEach((key) => deleteMultisig(key));
      setSelectedForDeletion(new Set());
      toast.success(
        `${selectedForDeletion.size} multisig(s) removed from list`
      );
    }
  };

  const handleStartEditLabel = (publicKey: string, currentLabel?: string) => {
    setEditingLabel(publicKey);
    setLabelInput(currentLabel || "");
  };

  const handleSaveLabel = (publicKey: string) => {
    updateMultisigLabel(publicKey, labelInput.trim());
    setEditingLabel(null);
    setLabelInput("");
    if (labelInput.trim()) {
      toast.success("Label updated");
    }
  };

  const handleCancelEdit = () => {
    setEditingLabel(null);
    setLabelInput("");
  };

  if (!publicKey) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground">
            Connect your wallet to view multisigs
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Your Multisigs</h2>
        <div className="flex items-center gap-2">
          {multisigs.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedForDeletion.size === multisigs.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              {selectedForDeletion.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedForDeletion.size})
                </Button>
              )}
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadMultisigs}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {multisigs.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground">
              No multisigs found. Create your first one!
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {multisigs.map((multisig) => {
          const isSelected = selectedForDeletion.has(
            multisig.publicKey.toString()
          );
          return (
            <Card
              key={multisig.publicKey.toString()}
              className={isSelected ? "border-primary" : ""}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        toggleSelect(multisig.publicKey.toString())
                      }
                      className="h-4 w-4 cursor-pointer"
                    />
                    {editingLabel === multisig.publicKey.toString() ? (
                      <Input
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveLabel(multisig.publicKey.toString());
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                        onBlur={() =>
                          handleSaveLabel(multisig.publicKey.toString())
                        }
                        placeholder="Enter label"
                        className="h-7 text-sm"
                        autoFocus
                      />
                    ) : (
                      <div className="flex min-w-0 flex-1 items-center gap-1">
                        <span className="truncate text-sm font-medium">
                          {multisig.label || "Unnamed"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            handleStartEditLabel(
                              multisig.publicKey.toString(),
                              multisig.label
                            )
                          }
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {multisig.threshold}/{multisig.members.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="space-y-1">
                  <div className="truncate font-mono text-xs">
                    {multisig.publicKey.toString().slice(0, 8)}...
                    {multisig.publicKey.toString().slice(-8)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {chains.find((c) => c.id === multisig.chainId)?.name ||
                      multisig.chainId}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm">
                  <p>TX Index: {multisig.transactionIndex.toString()}</p>
                  <p>Members: {multisig.members.length}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
