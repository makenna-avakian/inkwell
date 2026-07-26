"use client";

import { useState } from "react";
import { publishRuleSetAction } from "@/app/(seller)/shop/rules/actions";
import type { ContentBlock } from "@/server/shops/blocks";
import AddOnListEditor, { type AddOn } from "./AddOnListEditor";
import BlockEditor from "./BlockEditor";
import TierListEditor, { type Tier } from "./TierListEditor";

interface CommissionRulesEditorProps {
  shopId: string;
  initialTiers?: Tier[];
  initialAddOns?: AddOn[];
  initialBlocks?: ContentBlock[];
  initialMaxQueue?: number | null;
}

export default function CommissionRulesEditor({
  shopId,
  initialTiers = [],
  initialAddOns = [],
  initialBlocks = [],
  initialMaxQueue,
}: CommissionRulesEditorProps) {
  const [tiers, setTiers] = useState<Tier[]>(initialTiers);
  const [addOns, setAddOns] = useState<AddOn[]>(initialAddOns);
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [maxQueue, setMaxQueue] = useState<string>(initialMaxQueue?.toString() ?? "");
  const [error, setError] = useState<string | undefined>();
  const [publishing, setPublishing] = useState(false);

  async function handlePublish() {
    setPublishing(true);
    setError(undefined);
    try {
      const result = await publishRuleSetAction(shopId, {
        tiers,
        addOns,
        rulesContent: blocks,
        maxQueue: maxQueue ? Number(maxQueue) : null,
      });
      if (result.formError) setError(result.formError);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div data-testid="commission-rules-editor">
      {error && (
        <p role="alert" data-testid="commission-rules-editor-error" className="mb-3 text-red-700">
          {error}
        </p>
      )}

      <h2 className="mb-2 font-semibold">Pricing tiers</h2>
      <TierListEditor tiers={tiers} onChange={setTiers} />

      <h2 className="mt-6 mb-2 font-semibold">Add-ons</h2>
      <AddOnListEditor addOns={addOns} onChange={setAddOns} />

      <h2 className="mt-6 mb-2 font-semibold">Rules</h2>
      <BlockEditor blocks={blocks} onChange={setBlocks} />

      <div className="mt-6">
        <label htmlFor="maxQueue" className="mb-1 block text-sm font-medium">
          Max queue (leave blank for no limit)
        </label>
        <input
          id="maxQueue"
          type="number"
          value={maxQueue}
          onChange={(e) => setMaxQueue(e.target.value)}
          data-testid="commission-rules-editor-max-queue-input"
          className="w-32 rounded border border-gray-300 p-2"
        />
      </div>

      <button
        type="button"
        onClick={handlePublish}
        disabled={publishing}
        data-testid="commission-rules-editor-publish-button"
        className="mt-6 rounded-lg bg-black px-6 py-3 text-white disabled:opacity-50"
      >
        {publishing ? "Publishing..." : "Publish"}
      </button>
    </div>
  );
}
