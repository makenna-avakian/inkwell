"use client";

import { useActionState, useState } from "react";
import { createShopAction, updateShopAction, type ShopActionState } from "@/app/(seller)/shop/actions";
import SocialLinksEditor, { type SocialLink } from "./SocialLinksEditor";

const initialState: ShopActionState = { fieldErrors: {} };

interface ShopProfileFormProps {
  mode: "create" | "edit";
  shopId?: string;
  initialShopName?: string;
  initialBio?: string;
  initialSocialLinks?: SocialLink[];
}

export default function ShopProfileForm({
  mode,
  shopId,
  initialShopName,
  initialBio,
  initialSocialLinks = [],
}: ShopProfileFormProps) {
  const action = mode === "create" ? createShopAction : updateShopAction.bind(null, shopId!);
  const [state, formAction, pending] = useActionState(action, initialState);
  // Deterministic fallback id (not crypto.randomUUID()) — this initializer
  // runs independently during SSR and again on client hydration, so a random
  // id here would produce a server/client mismatch on first render.
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    initialSocialLinks.map((link, index) => ({ ...link, id: link.id || `initial-${index}` })),
  );

  return (
    <form action={formAction} className="space-y-4" data-testid="shop-profile-form">
      {state.formError && (
        <p role="alert" data-testid="shop-profile-form-error" className="text-red-700">
          {state.formError}
        </p>
      )}

      <div>
        <label htmlFor="shopName" className="mb-1 block text-sm font-medium text-foreground">
          Shop name <span className="text-muted normal-case">(optional — defaults to your account name)</span>
        </label>
        <input
          id="shopName"
          name="shopName"
          type="text"
          defaultValue={initialShopName}
          data-testid="shop-profile-form-shop-name-input"
          className="w-full border border-border bg-surface p-3 text-foreground focus:border-accent focus:outline-none"
        />
        {state.fieldErrors.shopName && (
          <p className="mt-1 text-sm text-red-700">{state.fieldErrors.shopName}</p>
        )}
      </div>

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

      <div>
        <p className="mb-1 text-sm font-medium text-foreground">Social links</p>
        <SocialLinksEditor socialLinks={socialLinks} onChange={setSocialLinks} />
        <input type="hidden" name="socialLinks" value={JSON.stringify(socialLinks)} />
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
