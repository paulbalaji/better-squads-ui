"use client";

import { Transaction } from "@solana/web3.js";
import { Check, Eye, Loader2, RefreshCw, X } from "lucide-react";
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
import { ledgerService } from "@/lib/ledger";
import { SquadService } from "@/lib/squad";
import { useChainStore } from "@/stores/chain-store";
import { useMultisigStore } from "@/stores/multisig-store";
import { useWalletStore } from "@/stores/wallet-store";
import type { ProposalAccount } from "@/types/multisig";
import { parseLedgerError } from "@/types/wallet";

import { TransactionDetailDialog } from "./transaction-detail-dialog";

interface ProposalListProps {
  onLoadingChange?: (loading: boolean) => void;
  refreshTrigger?: number;
}

export function ProposalList({
  onLoadingChange,
  refreshTrigger,
}: ProposalListProps = {}) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] =
    useState<ProposalAccount | null>(null);

  const { publicKey, derivationPath } = useWalletStore();
  const { chains } = useChainStore();
  const { proposals, setProposals, getSelectedMultisig, selectedMultisigKey } =
    useMultisigStore();

  const selectedMultisig = getSelectedMultisig();

  // Check if current wallet is a member of the selected multisig
  const isMember =
    publicKey &&
    selectedMultisig?.members.some(
      (member: { key: { toString: () => string } }) =>
        member.key.toString() === publicKey.toString()
    );

  const handleViewDetail = (proposal: ProposalAccount) => {
    setSelectedProposal(proposal);
    setDetailDialogOpen(true);
  };

  const loadProposals = useCallback(async () => {
    const multisig = getSelectedMultisig();
    if (!multisig) return;

    // Use the chain associated with the multisig
    const chain = chains.find((c) => c.id === multisig.chainId);
    if (!chain) {
      toast.error("Chain configuration not found for this multisig");
      return;
    }

    setLoading(true);
    onLoadingChange?.(true);
    try {
      const squadService = new SquadService(
        chain.rpcUrl,
        chain.squadsV4ProgramId
      );

      const proposalAccounts = await squadService.getProposalsByMultisig(
        multisig.publicKey
      );

      const loadedProposals: ProposalAccount[] = [];

      for (const acc of proposalAccounts) {
        if (!acc) continue;

        const status = acc.account.status.__kind;
        const proposal: ProposalAccount = {
          multisig: acc.account.multisig,
          transactionIndex: BigInt(acc.account.transactionIndex.toString()),
          creator: multisig.publicKey,
          status: status as ProposalAccount["status"],
          approvals: acc.account.approved || [],
          rejections: acc.account.rejected || [],
          executed: status === "Executed",
          cancelled: status === "Cancelled",
        };
        loadedProposals.push(proposal);
      }

      // Sort proposals by transaction index descending (newest first)
      loadedProposals.sort((a, b) => {
        return Number(b.transactionIndex - a.transactionIndex);
      });

      setProposals(loadedProposals);
    } catch (error) {
      console.error("Failed to load proposals:", error);
      toast.error("Failed to load proposals");
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMultisigKey, onLoadingChange, chains]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals, refreshTrigger]);

  const handleRefresh = async () => {
    await loadProposals();
  };

  const handleApprove = async (transactionIndex: bigint) => {
    if (!publicKey || !selectedMultisig) return;

    const chain = chains.find((c) => c.id === selectedMultisig.chainId);
    if (!chain) {
      toast.error("Chain configuration not found");
      return;
    }

    setActionLoading(`approve-${transactionIndex}`);
    try {
      const squadService = new SquadService(
        chain.rpcUrl,
        chain.squadsV4ProgramId
      );

      const instruction = await squadService.approveProposal({
        multisigPda: selectedMultisig.publicKey,
        transactionIndex,
        member: publicKey,
      });

      const transaction = new Transaction().add(instruction);
      const { blockhash } = await squadService
        .getConnection()
        .getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const serialized = transaction.serializeMessage();
      const signature = await ledgerService.signTransaction(
        serialized,
        derivationPath
      );

      transaction.addSignature(publicKey, signature);

      const txid = await squadService
        .getConnection()
        .sendRawTransaction(transaction.serialize());

      await squadService.getConnection().confirmTransaction(txid);

      toast.success("Proposal approved!");
      await loadProposals();
    } catch (error) {
      console.error("Failed to approve proposal:", error);
      const errorMessage = parseLedgerError(error);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (transactionIndex: bigint) => {
    if (!publicKey || !selectedMultisig) return;

    const chain = chains.find((c) => c.id === selectedMultisig.chainId);
    if (!chain) {
      toast.error("Chain configuration not found");
      return;
    }

    setActionLoading(`reject-${transactionIndex}`);
    try {
      const squadService = new SquadService(
        chain.rpcUrl,
        chain.squadsV4ProgramId
      );

      const instruction = await squadService.rejectProposal({
        multisigPda: selectedMultisig.publicKey,
        transactionIndex,
        member: publicKey,
      });

      const transaction = new Transaction().add(instruction);
      const { blockhash } = await squadService
        .getConnection()
        .getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const serialized = transaction.serializeMessage();
      const signature = await ledgerService.signTransaction(
        serialized,
        derivationPath
      );

      transaction.addSignature(publicKey, signature);

      const txid = await squadService
        .getConnection()
        .sendRawTransaction(transaction.serialize());

      await squadService.getConnection().confirmTransaction(txid);

      toast.success("Proposal rejected!");
      await loadProposals();
    } catch (error) {
      console.error("Failed to reject proposal:", error);
      const errorMessage = parseLedgerError(error);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecute = async (transactionIndex: bigint) => {
    if (!publicKey || !selectedMultisig) return;

    const chain = chains.find((c) => c.id === selectedMultisig.chainId);
    if (!chain) {
      toast.error("Chain configuration not found");
      return;
    }

    setActionLoading(`execute-${transactionIndex}`);
    try {
      const squadService = new SquadService(
        chain.rpcUrl,
        chain.squadsV4ProgramId
      );

      const result = await squadService.executeProposal({
        multisigPda: selectedMultisig.publicKey,
        transactionIndex,
        member: publicKey,
      });

      const instruction =
        typeof result === "object" && "instruction" in result
          ? result.instruction
          : result;

      const transaction = new Transaction().add(instruction);
      const { blockhash } = await squadService
        .getConnection()
        .getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const serialized = transaction.serializeMessage();
      const signature = await ledgerService.signTransaction(
        serialized,
        derivationPath
      );

      transaction.addSignature(publicKey, signature);

      const txid = await squadService
        .getConnection()
        .sendRawTransaction(transaction.serialize());

      await squadService.getConnection().confirmTransaction(txid);

      toast.success("Proposal executed!");
      await loadProposals();
    } catch (error) {
      console.error("Failed to execute proposal:", error);
      const errorMessage = parseLedgerError(error);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Proposals</h2>
          {selectedMultisig && (
            <p className="text-muted-foreground text-sm">
              {selectedMultisig.label || "Unnamed"} (
              {selectedMultisig.publicKey.toString().slice(0, 6)}...
              {selectedMultisig.publicKey.toString().slice(-4)})
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || !selectedMultisig}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!selectedMultisig && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              Select a multisig from the sidebar to view proposals
            </p>
          </CardContent>
        </Card>
      )}

      {selectedMultisig && (
        <>
          {proposals.length === 0 && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No proposals found</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {proposals.map((proposal: ProposalAccount) => {
              const approvalCount = proposal.approvals.length;
              const hasMetThreshold =
                selectedMultisig && approvalCount >= selectedMultisig.threshold;

              return (
                <Card key={proposal.transactionIndex.toString()}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        Proposal #{proposal.transactionIndex.toString()}
                      </span>
                      <Badge>{proposal.status}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Creator: {proposal.creator.toString().slice(0, 8)}...
                      {proposal.creator.toString().slice(-8)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>
                            Approvals: {approvalCount}
                            {selectedMultisig &&
                              ` / ${selectedMultisig.threshold}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <X className="h-4 w-4 text-red-500" />
                          <span>Rejections: {proposal.rejections.length}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetail(proposal)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Details
                        </Button>

                        {!proposal.executed && !proposal.cancelled && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleApprove(proposal.transactionIndex)
                              }
                              disabled={!isMember || actionLoading !== null}
                            >
                              {actionLoading ===
                              `approve-${proposal.transactionIndex}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleReject(proposal.transactionIndex)
                              }
                              disabled={!isMember || actionLoading !== null}
                            >
                              {actionLoading ===
                              `reject-${proposal.transactionIndex}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                            {hasMetThreshold && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  handleExecute(proposal.transactionIndex)
                                }
                                disabled={!isMember || actionLoading !== null}
                              >
                                {actionLoading ===
                                `execute-${proposal.transactionIndex}` ? (
                                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                ) : null}
                                Execute
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <TransactionDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        proposal={selectedProposal}
      />
    </div>
  );
}
