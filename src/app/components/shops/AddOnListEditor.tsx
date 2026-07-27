"use client";

export interface AddOn {
  id: string;
  name: string;
  priceDeltaCents: number;
}

interface AddOnListEditorProps {
  addOns: AddOn[];
  onChange: (addOns: AddOn[]) => void;
}

export default function AddOnListEditor({ addOns, onChange }: AddOnListEditorProps) {
  function addAddOn() {
    onChange([...addOns, { id: crypto.randomUUID(), name: "", priceDeltaCents: 0 }]);
  }

  function updateAddOn(id: string, patch: Partial<AddOn>) {
    onChange(addOns.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function removeAddOn(id: string) {
    onChange(addOns.filter((a) => a.id !== id));
  }

  return (
    <div data-testid="add-on-list-editor">
      {addOns.map((addOn) => (
        <div key={addOn.id} className="mb-3 flex gap-2">
          <input
            value={addOn.name}
            onChange={(e) => updateAddOn(addOn.id, { name: e.target.value })}
            placeholder="Add-on name"
            data-testid="add-on-list-editor-name-input"
            className="flex-1 border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
          />
          <input
            type="number"
            value={addOn.priceDeltaCents / 100}
            onChange={(e) =>
              updateAddOn(addOn.id, {
                priceDeltaCents: Math.round(Number(e.target.value) * 100),
              })
            }
            placeholder="+ Price"
            data-testid="add-on-list-editor-price-input"
            className="w-24 border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeAddOn(addOn.id)}
            data-testid="add-on-list-editor-remove-button"
            className="text-xs font-medium tracking-[0.1em] text-muted uppercase transition-colors hover:text-accent"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addAddOn}
        data-testid="add-on-list-editor-add-button"
        className="text-xs font-medium tracking-[0.1em] text-foreground uppercase underline underline-offset-4 transition-colors hover:text-accent"
      >
        + Add Add-on
      </button>
    </div>
  );
}
