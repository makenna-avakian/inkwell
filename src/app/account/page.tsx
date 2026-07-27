import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { findUserById } from "@/server/auth/repository";
import Navbar from "@/app/components/Navbar";
import DisplayNameForm from "@/app/components/account/DisplayNameForm";
import ChangePasswordForm from "@/app/components/account/ChangePasswordForm";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await findUserById(session.user.id);
  if (!user) redirect("/sign-in");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg p-8 pt-32">
        <h1 className="mb-8 font-serif text-4xl font-medium tracking-tight text-foreground">Account</h1>

        <p className="mb-1 text-xs font-medium tracking-[0.1em] text-muted uppercase">Email</p>
        <p data-testid="account-page-email" className="mb-10 text-foreground">
          {user.email}
        </p>

        <h2 className="mb-4 border-t border-border pt-4 text-xs font-medium tracking-[0.15em] text-muted uppercase">
          Display Name
        </h2>
        <DisplayNameForm initialDisplayName={user.displayName} />

        {user.passwordHash && (
          <>
            <h2 className="mt-10 mb-4 border-t border-border pt-4 text-xs font-medium tracking-[0.15em] text-muted uppercase">
              Change Password
            </h2>
            <ChangePasswordForm />
          </>
        )}
      </main>
    </>
  );
}
