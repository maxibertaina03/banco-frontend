import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__orb auth-shell__orb--one" />
      <div className="auth-shell__orb auth-shell__orb--two" />
      <div className="auth-shell__card">
        <Link href="/" className="brand-mark brand-mark--center">
          <span className="brand-mark__icon">O</span>
          <span>
            <strong>Orbital</strong>
            <small>Acceso seguro</small>
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
