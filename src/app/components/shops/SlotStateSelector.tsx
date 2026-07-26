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
      {error && <p role="alert">{error}</p>}
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleSelect(option.value)}
          aria-pressed={state === option.value}
          data-testid={`slot-state-selector-${option.value}-option`}
          className={`mr-2 rounded-lg border px-4 py-2 ${
            state === option.value ? "bg-black text-white" : "border-gray-300"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
