import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-8">
          <span className="text-3xl font-bold text-white">🏦 Banco</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
