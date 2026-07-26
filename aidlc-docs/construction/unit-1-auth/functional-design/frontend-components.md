# Frontend Components — Unit 1: Auth & Accounts

## Component Hierarchy

```
src/app/(auth)/
  sign-up/page.tsx        -> <SignUpForm />
  sign-in/page.tsx         -> <SignInForm />
src/app/components/auth/
  SignUpForm.tsx
  SignInForm.tsx
  OAuthButton.tsx          (reused by both forms, Google only per Question 3: B)
  AuthErrorBanner.tsx
```

## SignUpForm
- **Props**: none (page-level component; reads no external state).
- **State**: `email`, `password`, `displayName?`, `submitting`, `fieldErrors`.
- **User interactions**: submit → calls `Auth.signUp`; on success, redirect to `/`; on failure, populate `fieldErrors` / `AuthErrorBanner`.
- **Form validation** (client-side, mirrored server-side per SECURITY-05 — client validation is UX only, never trusted alone): email format (BR-1), password length >= 8 (BR-2 partial — breach-list check is server-only).
- **API integration**: `Auth.signUp` (Server Action).

## SignInForm
- **Props**: none.
- **State**: `email`, `password`, `submitting`, `fieldErrors`, `retryAfterSeconds` (populated from a BR-6 progressive-delay response so the UI can show "try again in Ns" rather than a raw error).
- **User interactions**: submit → calls `Auth.signIn`; on failure, shows the **generic** "invalid email or password" message (never distinguishes unknown-email from wrong-password, per business-logic-model.md's enumeration-prevention rule).
- **API integration**: `Auth.signIn` (Server Action).

## OAuthButton
- **Props**: `provider: 'google'` (only value in Phase 1).
- **User interactions**: click → redirects into Auth.js's Google OAuth flow.
- Shared by `SignUpForm` and `SignInForm` (same visual control, same flow, since sign-up and sign-in via OAuth are the same action per business-logic-model.md).

## AuthErrorBanner
- **Props**: `message: string`.
- **Purpose**: Generic error display component; ensures error messages are always the pre-approved generic strings (never raw server errors), per SECURITY-09 (no internal details in user-facing errors).

## Navigation Integration
The existing brownfield `Navbar` component is being replaced entirely (per requirements.md — no migration of existing UI); the new navbar (owned by a later unit's UI, not Unit 1) will show Sign In / Sign Up when unauthenticated, and the user's `displayName` + Sign Out when authenticated, by reading session state via `Auth.getSession`.
