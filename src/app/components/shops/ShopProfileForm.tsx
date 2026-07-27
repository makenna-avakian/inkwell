"use client";

import { useActionState } from "react";
import { createShopAction, updateShopAction, type ShopActionState } from "@/app/(seller)/shop/actions";

const initialState: ShopActionState = { fieldErrors: {} };

interface ShopProfileFormProps {
  mode: "create" | "edit";
  shopId?: string;
  initialBio?: string;
}

export default function ShopProfileForm({ mode, shopId, initialBio }: ShopProfileFormProps) {
  const action = mode === "create" ? createShopAction : updateShopAction.bind(null, shopId!);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4" data-testid="shop-profile-form">
      {state.formError && (
        <p role="alert" data-testid="shop-profile-form-error" className="text-red-700">
          {state.formError}
        </p>
      )}

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium text-foreground">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={initialBio}
          data-testid="shop-profile-form-bio-input"
          className="w-full border border-border bg-surface p-3 text-foreground focus:border-accent focus:outline-none"
        />
        {state.fieldErrors.bio && <p className="mt-1 text-sm text-red-700">{state.fieldErrors.bio}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        data-testid="shop-profile-form-submit-button"
        className="border border-foreground bg-foreground px-6 py-3 text-xs font-medium tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent disabled:opacity-50"
      >
        {pending ? "Saving..." : mode === "create" ? "Create Shop" : "Save Changes"}
      </button>
    </form>
  );
}
