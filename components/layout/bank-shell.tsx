'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const navigation = [
  { href: '/dashboard', label: 'Resumen' },
  { href: '/cuentas', label: 'Cuentas' },
  { href: '/transferencias', label: 'Transferencias' },
];

type BankShellProps = {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
  variant?: 'user' | 'admin';
  showAdminLink?: boolean;
  showUserLink?: boolean;
};

export function BankShell({
  children,
  title,
  eyebrow,
  description,
  variant = 'user',
  showAdminLink = false,
  showUserLink = false,
}: BankShellProps) {
  const pathname = usePathname();
  const computedNavigation = [
    ...navigation,
    ...(showAdminLink ? [{ href: '/admin', label: 'Admin' }] : []),
    ...(showUserLink ? [{ href: '/dashboard', label: 'User' }] : []),
  ];

  return (
    <div className={`bank-app-shell bank-app-shell--${variant}`}>
      <aside className={`bank-sidebar bank-sidebar--${variant}`}>
        <Link href="/" className="brand-mark">
          <span className="brand-mark__icon">O</span>
          <span>
            <strong>Orbital</strong>
            <small>{variant === 'admin' ? 'Panel de control' : 'Banca orbital'}</small>
          </span>
        </Link>

        <nav className="bank-nav">
          {computedNavigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? 'bank-nav__item is-active' : 'bank-nav__item'}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="bank-main">
        <header className={`bank-header bank-header--${variant}`}>
          <div>
            {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
            <h1 className="page-title">{title}</h1>
            {description ? <p className="page-description">{description}</p> : null}
          </div>

          <div className="bank-header__actions">
            <Link href="/" className="ghost-link">
              Inicio
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <main className="bank-content">{children}</main>
      </div>
    </div>
  );
}
