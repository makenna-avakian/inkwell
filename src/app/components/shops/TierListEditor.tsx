"use client";

export interface Tier {
  id: string;
  name: string;
  description: string;
  priceCents: number;
}

interface TierListEditorProps {
  tiers: Tier[];
  onChange: (tiers: Tier[]) => void;
}

export default function TierListEditor({ tiers, onChange }: TierListEditorProps) {
  function addTier() {
    onChange([
      ...tiers,
      { id: crypto.randomUUID(), name: "", description: "", priceCents: 0 },
    ]);
  }

  function updateTier(id: string, patch: Partial<Tier>) {
    onChange(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function removeTier(id: string) {
    onChange(tiers.filter((t) => t.id !== id));
  }

  return (
    <div data-testid="tier-list-editor">
      {tiers.map((tier) => (
        <div key={tier.id} className="mb-3 flex gap-2" data-testid={`tier-list-editor-row-${tier.id}`}>
          <input
            value={tier.name}
            onChange={(e) => updateTier(tier.id, { name: e.target.value })}
            placeholder="Tier name"
            data-testid="tier-list-editor-name-input"
            className="flex-1 rounded border border-gray-300 p-2"
          />
          <input
            type="number"
            value={tier.priceCents / 100}
            onChange={(e) =>
              updateTier(tier.id, { priceCents: Math.round(Number(e.target.value) * 100) })
            }
            placeholder="Price"
            data-testid="tier-list-editor-price-input"
            className="w-24 rounded border border-gray-300 p-2"
          />
          <button
            type="button"
            onClick={() => removeTier(tier.id)}
            data-testid="tier-list-editor-remove-button"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addTier}
        data-testid="tier-list-editor-add-button"
        className="text-sm underline"
      >
        + Add tier
      </button>
    </div>
  );
}
