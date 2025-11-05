"use client";

import { ChevronDown, FileDown, Plus } from "lucide-react";
import { useState } from "react";

import { CreateMultisigDialog } from "@/components/create-multisig-dialog";
import { ImportMultisigDialog } from "@/components/import-multisig-dialog";
import { MultisigList } from "@/components/multisig-list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Multisig Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your multisig wallets across SVM chains
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Multisig
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
              <FileDown className="mr-2 h-4 w-4" />
              Import Existing
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <MultisigList />

      <CreateMultisigDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <ImportMultisigDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  );
}
