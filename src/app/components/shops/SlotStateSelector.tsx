"use client";

import { useState } from "react";
import { setSlotStateAction } from "@/app/(seller)/shop/rules/actions";

type SlotState = "open" | "closed" | "waitlist";

interface SlotStateSelectorProps {
  shopId: string;
  currentState: SlotState;
}

const OPTIONS: { value: SlotState; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "waitlist", label: "Waitlist" },
];

export default function SlotStateSelector({ shopId, currentState }: SlotStateSelectorProps) {
  const [state, setState] = useState(currentState);
  const [error, setError] = useState<string | undefined>();

  async function handleSelect(next: SlotState) {
    const previous = state;
    setState(next); // optimistic
    const result = await setSlotStateAction(shopId, next);
    if (result.formError) {
      setState(previous);
      setError(result.formError);
    }
  }

  return (
    <div data-testid="slot-state-selector">
      {error && <p role="alert" className="mb-2 text-sm text-red-700">{error}</p>}
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleSelect(option.value)}
          aria-pressed={state === option.value}
          data-testid={`slot-state-selector-${option.value}-option`}
          className={`mr-2 border px-4 py-2 text-xs font-medium tracking-[0.1em] uppercase transition-colors ${
            state === option.value
              ? "border-foreground bg-foreground text-surface"
              : "border-border text-foreground hover:border-accent hover:text-accent"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
