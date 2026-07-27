interface AuthErrorBannerProps {
  message: string;
}

/** SECURITY-09: only ever renders pre-approved generic messages, never raw server errors. */
export default function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  return (
    <div
      role="alert"
      data-testid="auth-error-banner"
      className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800"
    >
      {message}
    </div>
  );
}
