"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  chainNameSchema,
  programIdSchema,
  rpcUrlSchema,
} from "@/lib/validation";
import { useChainStore } from "@/stores/chain-store";
import type { ChainConfig } from "@/types/chain";

interface ChainManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const chainFormSchema = z.object({
  name: chainNameSchema,
  rpcUrl: rpcUrlSchema,
  squadsV4ProgramId: programIdSchema,
  explorerUrl: rpcUrlSchema.optional().or(z.literal("")),
});

type ChainFormValues = z.infer<typeof chainFormSchema>;

export function ChainManagementDialog({
  open,
  onOpenChange,
}: ChainManagementDialogProps) {
  const { chains, addChain, updateChain, deleteChain, resetToDefaults } =
    useChainStore();
  const [editingChain, setEditingChain] = useState<ChainConfig | null>(null);

  const form = useForm<ChainFormValues>({
    resolver: zodResolver(chainFormSchema),
    defaultValues: {
      name: "",
      rpcUrl: "",
      squadsV4ProgramId: "",
      explorerUrl: "",
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (editingChain) {
      updateChain(editingChain.id, {
        name: data.name,
        rpcUrl: data.rpcUrl,
        squadsV4ProgramId: data.squadsV4ProgramId,
        explorerUrl: data.explorerUrl || undefined,
      });
      toast.success("Chain updated successfully");
    } else {
      const newChain: ChainConfig = {
        id: `custom-${crypto.randomUUID()}`,
        name: data.name,
        rpcUrl: data.rpcUrl,
        squadsV4ProgramId: data.squadsV4ProgramId,
        explorerUrl: data.explorerUrl || undefined,
      };
      addChain(newChain);
      toast.success("Chain added successfully");
    }

    resetForm();
  });

  const handleEdit = (chain: ChainConfig) => {
    setEditingChain(chain);
    form.reset({
      name: chain.name,
      rpcUrl: chain.rpcUrl,
      squadsV4ProgramId: chain.squadsV4ProgramId,
      explorerUrl: chain.explorerUrl || "",
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this chain configuration?")) {
      deleteChain(id);
      toast.success("Chain deleted successfully");
    }
  };

  const handleResetToDefaults = () => {
    if (
      confirm(
        "Are you sure you want to reset all chains to default? This will remove all custom chains."
      )
    ) {
      resetToDefaults();
      resetForm();
      toast.success("Chains reset to defaults");
    }
  };

  const resetForm = () => {
    setEditingChain(null);
    form.reset({
      name: "",
      rpcUrl: "",
      squadsV4ProgramId: "",
      explorerUrl: "",
    });
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent
        key={`chain-dialog-${open}`}
        className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]"
      >
        <DialogHeader>
          <DialogTitle>Chain Management</DialogTitle>
          <DialogDescription>
            Add or manage custom SVM chain configurations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Chain Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Eclipse Mainnet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rpcUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      RPC URL <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      Must use HTTPS or WSS protocol for security
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="squadsV4ProgramId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Squad Program ID{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="explorerUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explorer URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://explorer.solana.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  {editingChain ? "Update Chain" : "Add Chain"}
                </Button>
                {editingChain && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Configured Chains</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToDefaults}
              >
                <RotateCcw className="mr-2 h-3 w-3" />
                Reset to Defaults
              </Button>
            </div>
            <div className="space-y-2">
              {chains.map((chain) => (
                <div
                  key={chain.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{chain.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {chain.rpcUrl}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(chain)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {chain.id !== "solana-mainnet" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(chain.id)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
