import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Registration removed</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Eventra no longer requires an account. Browse events and register as a guest.
        </p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">
          Go to home
        </Link>
      </div>
    </div>
  );
}
