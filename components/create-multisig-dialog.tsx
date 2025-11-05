"use client";

import { PublicKey, Transaction } from "@solana/web3.js";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ledgerService } from "@/lib/ledger";
import { SquadService } from "@/lib/squad";
import { useChainStore } from "@/stores/chain-store";
import { useMultisigStore } from "@/stores/multisig-store";
import { useWalletStore } from "@/stores/wallet-store";
import type { SquadMember } from "@/types/squad";
import { parseLedgerError } from "@/types/wallet";

interface CreateMultisigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Member {
  address: string;
  permissions: number;
}

interface CreateMultisigFormValues {
  chainId: string;
  threshold: number;
  members: Member[];
}

export function CreateMultisigDialog({
  open,
  onOpenChange,
}: CreateMultisigDialogProps) {
  const [loading, setLoading] = useState(false);

  const { publicKey, derivationPath } = useWalletStore();
  const { getSelectedChain, chains } = useChainStore();
  const { addMultisig } = useMultisigStore();

  const form = useForm<CreateMultisigFormValues>({
    defaultValues: {
      chainId: "",
      threshold: 2,
      members: [{ address: "", permissions: 7 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!data.chainId) {
      toast.error("Please select a chain");
      return;
    }

    const chain = chains.find((c) => c.id === data.chainId);
    if (!chain) {
      toast.error("Selected chain not found");
      return;
    }

    if (data.members.length < 2) {
      toast.error("At least 2 members are required");
      return;
    }

    if (data.threshold < 1 || data.threshold > data.members.length) {
      toast.error("Invalid threshold value");
      return;
    }

    const invalidMembers = data.members.filter((m) => {
      try {
        new PublicKey(m.address);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidMembers.length > 0) {
      toast.error("Invalid member addresses");
      return;
    }

    setLoading(true);
    try {
      const squadService = new SquadService(
        chain.rpcUrl,
        chain.squadsV4ProgramId
      );

      const { multisigPda, createKey, instruction } =
        await squadService.createMultisig({
          creator: publicKey,
          threshold: data.threshold,
          members: data.members.map((m) => ({
            key: new PublicKey(m.address),
            permissions: { mask: m.permissions },
          })),
        });

      const transaction = new Transaction().add(instruction);
      const { blockhash } = await squadService
        .getConnection()
        .getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      transaction.partialSign(createKey);

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

      const multisigAccount = await squadService.getMultisig(multisigPda);

      addMultisig({
        publicKey: multisigPda,
        threshold: multisigAccount.threshold,
        members: multisigAccount.members.map((m: SquadMember) => ({
          key: m.key,
          permissions: { mask: m.permissions.mask },
        })),
        transactionIndex: BigInt(multisigAccount.transactionIndex.toString()),
        msChangeIndex: 0,
        programId: new PublicKey(chain.squadsV4ProgramId),
        chainId: chain.id,
      });

      toast.success("Multisig created successfully!");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create multisig:", error);
      const errorMessage = parseLedgerError(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  });

  // Set default chain when dialog opens
  useEffect(() => {
    if (open && !form.getValues("chainId") && chains.length > 0) {
      const currentChain = getSelectedChain();
      form.setValue("chainId", currentChain?.id || chains[0].id);
    }
  }, [open, chains, form, getSelectedChain]);

  useEffect(() => {
    if (!open) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        key={`create-dialog-${open}`}
        className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]"
      >
        <DialogHeader>
          <DialogTitle>Create Multisig</DialogTitle>
          <DialogDescription>
            Create a new multisig wallet with custom threshold and members
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="chainId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Chain <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a chain" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {chains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id}>
                          {chain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Threshold <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={fields.length}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of signatures required to approve a transaction
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Members</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ address: "", permissions: 7 })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`members.${index}.address`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Member address" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`members.${index}.permissions`}
                      render={({ field }) => (
                        <FormItem className="w-20">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Perms"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Multisig"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
