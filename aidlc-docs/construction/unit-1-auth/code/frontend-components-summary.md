# Frontend Components Summary — Unit 1: Auth & Accounts

## Created
- `src/app/components/auth/SignUpForm.tsx`, `SignInForm.tsx`, `OAuthButton.tsx`, `AuthErrorBanner.tsx`
- `src/app/(auth)/sign-up/page.tsx`, `src/app/(auth)/sign-in/page.tsx`
- `src/app/(auth)/sign-up/actions.ts`, `src/app/(auth)/sign-in/actions.ts`, `src/app/(auth)/oauth-actions.ts`
- `src/app/components/auth/sign-out-action.ts`

## Modified
- `src/app/components/Navbar.tsx` — replaced the personal-site navbar with a minimal session-aware one (Sign In/Sign Up vs. displayName + Sign Out). Marketplace nav links added by later units.
- `src/app/layout.tsx` — metadata title/description now reflect Inkwell, not the old portfolio site.
- `src/app/page.tsx` — replaced the personal-portfolio hero with a minimal Inkwell placeholder landing page; real browse/discovery lands with Unit 4.

## Removed (superseded personal-site files, Step 2)
- `src/app/gallery/page.tsx`, `src/app/contact/page.tsx`, `src/app/design/page.tsx`
- `src/app/components/CatEyes.tsx`, `src/app/components/IntroAnimation.tsx`, old `src/app/components/Navbar.tsx`

## Automation-Friendly Attributes
All interactive elements carry stable `data-testid`s following the `{component}-{element-role}` convention (e.g., `sign-up-submit-button`, `navbar-sign-out-button`), per the Automation Friendly Code Rules in core-workflow.md.

## Tests
- `SignUpForm.test.tsx`, `SignInForm.test.tsx` — React Testing Library, server actions mocked (per the standard pattern for testing Next.js Server-Action-backed forms without a running server).
