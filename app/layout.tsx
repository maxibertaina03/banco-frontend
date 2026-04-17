import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banco App - Sistema Bancario",
  description: "Plataforma bancaria segura con autenticación Clerk",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 min-h-screen">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
