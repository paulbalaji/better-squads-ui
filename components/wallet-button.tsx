"use client";

import { Copy, LogOut, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ledgerService } from "@/lib/ledger";
import { useWalletStore } from "@/stores/wallet-store";

import { WalletConnectDialog } from "./wallet-connect-dialog";

export function WalletButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { connected, publicKey, disconnect } = useWalletStore();

  const handleDisconnect = async () => {
    await ledgerService.disconnect();
    disconnect();
    toast.success("Wallet disconnected");
  };

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      toast.success("Address copied to clipboard");
    }
  };

  if (!connected || !publicKey) {
    return (
      <>
        <Button onClick={() => setDialogOpen(true)} variant="default">
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
        <WalletConnectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Wallet className="mr-2 h-4 w-4" />
          {publicKey.toString().slice(0, 4)}...
          {publicKey.toString().slice(-4)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Connected Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect}>
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
