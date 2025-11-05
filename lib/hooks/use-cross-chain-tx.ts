import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { useState } from "react";
import { toast } from "sonner";

import { crossChainTxService } from "@/lib/cross-chain-tx";
import { ledgerService } from "@/lib/ledger";
import { useChainStore } from "@/stores/chain-store";
import { useWalletStore } from "@/stores/wallet-store";
import type { ChainConfig } from "@/types/chain";
import { WalletType } from "@/types/wallet";

export interface CrossChainTxOptions {
  skipPreflight?: boolean;
  maxRetries?: number;
  storeBeforeSend?: boolean;
  transactionId?: string;
}

export function useCrossChainTransaction() {
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [signedTransaction, setSignedTransaction] = useState<
    Buffer | Uint8Array | null
  >(null);

  const { signTransaction } = useWallet();
  const { walletType, publicKey, derivationPath } = useWalletStore();
  const { getSelectedChain } = useChainStore();

  const executeTransaction = async (
    transaction: Transaction | VersionedTransaction,
    targetChain?: ChainConfig,
    options?: CrossChainTxOptions
  ): Promise<string | null> => {
    if (!publicKey) {
      toast.error("Wallet not connected");
      return null;
    }

    setLoading(true);
    setSignature(null);

    try {
      const chain = targetChain || getSelectedChain();
      if (!chain) {
        throw new Error("No chain selected");
      }

      let txSignature: string;

      if (walletType === WalletType.BROWSER) {
        // Browser wallet: inject blockhash and sign
        if (!signTransaction) {
          throw new Error("Wallet does not support transaction signing");
        }

        txSignature = await crossChainTxService.executeTransaction(
          transaction,
          chain,
          { publicKey, signTransaction },
          options
        );
      } else if (walletType === WalletType.LEDGER) {
        // Ledger: inject blockhash and sign with Ledger
        if (!derivationPath) {
          throw new Error("Derivation path not found");
        }

        const txWithBlockhash = await crossChainTxService.injectBlockhash(
          transaction,
          chain
        );

        // Sign with Ledger
        const serialized =
          txWithBlockhash instanceof Transaction
            ? txWithBlockhash.serializeMessage()
            : Buffer.from(txWithBlockhash.message.serialize());

        const signedBuffer = await ledgerService.signTransaction(
          serialized,
          derivationPath
        );

        // Optionally store before sending
        if (options?.storeBeforeSend && options?.transactionId) {
          crossChainTxService.storeSignedTransaction(
            chain.id,
            options.transactionId,
            {
              transaction: signedBuffer.toString("base64"),
              signatures: [signedBuffer.toString("base64")],
              timestamp: Date.now(),
            }
          );
        }

        // Send to target chain
        txSignature = await crossChainTxService.sendSignedTransaction(
          signedBuffer,
          chain,
          options
        );
      } else {
        throw new Error("Unsupported wallet type");
      }

      setSignature(txSignature);
      toast.success("Transaction sent successfully", {
        description: `Signature: ${txSignature.slice(0, 8)}...${txSignature.slice(-8)}`,
      });

      return txSignature;
    } catch (error) {
      console.error("Transaction failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to execute transaction"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const confirmTransaction = async (
    sig: string,
    targetChain?: ChainConfig,
    commitment: "processed" | "confirmed" | "finalized" = "confirmed"
  ): Promise<boolean> => {
    const chain = targetChain || getSelectedChain();
    if (!chain) {
      toast.error("No chain selected");
      return false;
    }

    try {
      const confirmed = await crossChainTxService.confirmTransaction(
        sig,
        chain,
        commitment
      );

      if (confirmed) {
        toast.success("Transaction confirmed");
      } else {
        toast.error("Transaction failed");
      }

      return confirmed;
    } catch (error) {
      console.error("Confirmation failed:", error);
      toast.error("Failed to confirm transaction");
      return false;
    }
  };

  const signOnly = async (
    transaction: Transaction | VersionedTransaction,
    targetChain?: ChainConfig
  ): Promise<Buffer | Uint8Array | null> => {
    if (!publicKey) {
      toast.error("Wallet not connected");
      return null;
    }

    setLoading(true);
    setSignedTransaction(null);

    try {
      const chain = targetChain || getSelectedChain();
      if (!chain) {
        throw new Error("No chain selected");
      }

      let signed: Buffer | Uint8Array;

      if (walletType === WalletType.BROWSER) {
        if (!signTransaction) {
          throw new Error("Wallet does not support transaction signing");
        }

        const txWithBlockhash = await crossChainTxService.injectBlockhash(
          transaction,
          chain
        );

        const signedTx = await signTransaction(txWithBlockhash);
        signed =
          signedTx instanceof Transaction
            ? signedTx.serialize()
            : signedTx.serialize();
      } else if (walletType === WalletType.LEDGER) {
        if (!derivationPath) {
          throw new Error("Derivation path not found");
        }

        const txWithBlockhash = await crossChainTxService.injectBlockhash(
          transaction,
          chain
        );

        const serialized =
          txWithBlockhash instanceof Transaction
            ? txWithBlockhash.serializeMessage()
            : Buffer.from(txWithBlockhash.message.serialize());

        signed = await ledgerService.signTransaction(
          serialized,
          derivationPath
        );
      } else {
        throw new Error("Unsupported wallet type");
      }

      setSignedTransaction(signed);
      toast.success("Transaction signed successfully");
      return signed;
    } catch (error) {
      console.error("Signing failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to sign transaction"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendSignedTransaction = async (
    signedTx: Buffer | Uint8Array,
    targetChain?: ChainConfig,
    options?: Pick<CrossChainTxOptions, "skipPreflight" | "maxRetries">
  ): Promise<string | null> => {
    setLoading(true);
    setSignature(null);

    try {
      const chain = targetChain || getSelectedChain();
      if (!chain) {
        throw new Error("No chain selected");
      }

      const txSignature = await crossChainTxService.sendSignedTransaction(
        signedTx,
        chain,
        options
      );

      setSignature(txSignature);
      toast.success("Transaction sent successfully", {
        description: `Signature: ${txSignature.slice(0, 8)}...${txSignature.slice(-8)}`,
      });

      return txSignature;
    } catch (error) {
      console.error("Send failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send transaction"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    executeTransaction,
    signOnly,
    sendSignedTransaction,
    confirmTransaction,
    loading,
    signature,
    signedTransaction,
  };
}
