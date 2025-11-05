"use client";

import { useState } from "react";

import { MultisigSidebar } from "@/components/multisig-sidebar";
import { ProposalList } from "@/components/proposal-list";

export default function ProposalsPage() {
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex gap-6">
      <aside className="w-64 shrink-0">
        <MultisigSidebar onRefresh={handleRefresh} loading={loading} />
      </aside>
      <main className="min-w-0 flex-1">
        <ProposalList
          onLoadingChange={setLoading}
          refreshTrigger={refreshTrigger}
        />
      </main>
    </div>
  );
}
