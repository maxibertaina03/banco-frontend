import { lazy, Suspense } from "react";
import { getSectionItems, roleLabels } from "./portal.config";
import { Header } from "../components/Header";
import { PortalHero } from "../components/layout/PortalHero";
import { PortalSummary } from "../components/layout/PortalSummary";
import { PortalTabs } from "../components/layout/PortalTabs";
import { PortalToolbar } from "../components/layout/PortalToolbar";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { SectionLoader } from "../components/SectionLoader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { formatCurrency } from "../lib/utils/currency";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { TransferReceiptDialog } from "../components/TransferReceiptDialog";
import { TransactionDetailDialog } from "../components/TransactionDetailDialog";
import { usePortalPage } from "../hooks/usePortalPage";

// Sections cargadas perezosamente: cada una se descarga en su propio chunk
// cuando el usuario navega a esa tab. Beneficio principal: el cliente normal
// nunca descarga AdminSection (~30 KB con su árbol).
// Vite admite la forma `import(...).then(m => ({ default: m.Named }))` para
// re-exportar un named export como default sin tocar el archivo origen.
const AccountsSection = lazy(() =>
  import("../features/cuentas/sections/AccountsSection").then((m) => ({ default: m.AccountsSection }))
);
const AdminSection = lazy(() =>
  import("../features/admin/sections/AdminSection").then((m) => ({ default: m.AdminSection }))
);
const CompleteProfileSection = lazy(() =>
  import("../features/personas/sections/CompleteProfileSection").then((m) => ({
    default: m.CompleteProfileSection,
  }))
);
const DashboardSection = lazy(() =>
  import("../features/dashboard/sections/DashboardSection").then((m) => ({ default: m.DashboardSection }))
);
const RecipientsSection = lazy(() =>
  import("../features/destinatarios/sections/RecipientsSection").then((m) => ({
    default: m.RecipientsSection,
  }))
);
const TransactionsSection = lazy(() =>
  import("../features/transacciones/sections/TransactionsSection").then((m) => ({
    default: m.TransactionsSection,
  }))
);

export function PortalPage() {
  const {
    activeRole,
    setActiveRole,
    section,
    setSection,
    error,
    setError,
    success,
    setSuccess,
    authProfile,
    profile,
    loading,
    needsProfileCompletion,
    warning,
    scope,
    totalBalance,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createClientForm,
    setCreateClientForm,
    selectedAccountForAlias,
    setSelectedAccountForAlias,
    submitting,
    personas,
    selectedPersonaId,
    roleOptions,
    accountTypes,
    banks,
    manualPersonaId,
    setManualPersonaId,
    activities,
    transactionTypes,
    roles,
    bulkSyncing,
    lastSyncResult,
    recipientResetSignal,
    syncingAccountId,
    syncingIncoming,
    transferResetSignal,
    handleGoToAccounts,
    handleGoToActivity,
    handleGoToContacts,
    handleGoToTransactions,
    handleLoadPersona,
    handleCopyCbu,
    handleIncome,
    handleAliasUpdated,
    handleSyncAccountCb,
    handleBulkSyncCb,
    handleSyncIncomingCb,
    handleRecipientDeleteCb,
    handleAccountSynced,
    handleCompleteProfile,
    handleCreateClient,
    handleRecipientCreate,
    handleTransfer,
    refreshDestinatarios,
    refreshPersonaData,
    transferReceipt,
    setTransferReceipt,
    selectedTransaction,
    setSelectedTransaction,
    openTransactionDetail,
  } = usePortalPage();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header
          displayName={
            profile
              ? `${profile.persona.nombre} ${profile.persona.apellido}`
              : authProfile
                ? `${authProfile.nombre} ${authProfile.apellido}`.trim() || "Orbital"
                : "Orbital"
          }
          authProfile={authProfile}
          personaId={profile?.persona.id}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {!needsProfileCompletion && (
            <section className="mb-8 grid gap-6 lg:grid-cols-[1.45fr_0.55fr]">
              <PortalHero
                activeRole={activeRole}
                onRoleChange={setActiveRole}
                roleLabels={roleLabels}
                roleOptions={roleOptions}
              />
              <PortalSummary
                activeAccountsCount={profile?.cuentas.filter((account) => account.activa).length || 0}
                totalBalanceLabel={formatCurrency(totalBalance)}
              />
            </section>
          )}

          {!needsProfileCompletion && (
            <PortalToolbar
              loading={loading}
              manualPersonaId={manualPersonaId}
              onLoadPersona={handleLoadPersona}
              onManualPersonaChange={setManualPersonaId}
              personas={personas}
              scope={scope}
              selectedPersonaId={selectedPersonaId}
              submitting={submitting}
            />
          )}

          {warning && (
            <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
              {warning}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              {success}
            </div>
          )}

          {needsProfileCompletion ? (
            <Suspense fallback={<SectionLoader />}>
              <CompleteProfileSection
                authProfile={authProfile}
                submitting={submitting}
                onSubmit={handleCompleteProfile}
              />
            </Suspense>
          ) : (
            <>
              <PortalTabs items={getSectionItems(scope)} onSectionChange={setSection} section={section} />

              {loading || !profile ? (
                <Card className="border-primary/20 bg-[#1C0B2E]">
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    Cargando datos de Orbital...
                  </CardContent>
                </Card>
              ) : (
                <Suspense fallback={<SectionLoader />}>
                  {section === "dashboard" && (
                    <ErrorBoundary>
                      <DashboardSection
                        activities={activities}
                        loading={loading}
                        onAccounts={handleGoToAccounts}
                        onActivity={handleGoToActivity}
                        onContacts={handleGoToContacts}
                        onCopyCbu={handleCopyCbu}
                        onIncome={handleIncome}
                        onTransfer={handleGoToTransactions}
                        onSelectActivity={openTransactionDetail}
                      />
                    </ErrorBoundary>
                  )}

                  {section === "accounts" && (
                    <ErrorBoundary>
                      <AccountsSection
                        profile={profile}
                        selectedAccountForAlias={selectedAccountForAlias}
                        onAliasEdit={setSelectedAccountForAlias}
                        onAliasUpdated={handleAliasUpdated}
                        onSyncAccount={scope === "admin" ? handleSyncAccountCb : undefined}
                        onBulkSync={scope === "admin" ? handleBulkSyncCb : undefined}
                        syncingAccountId={syncingAccountId}
                        bulkSyncing={bulkSyncing}
                      />
                    </ErrorBoundary>
                  )}

                  {section === "transactions" && (
                    <ErrorBoundary>
                      <TransactionsSection
                        activities={activities}
                        lastSyncResult={lastSyncResult}
                        loading={loading}
                        onSubmit={handleTransfer}
                        onSyncIncoming={handleSyncIncomingCb}
                        profile={profile}
                        submitting={submitting}
                        syncingIncoming={syncingIncoming}
                        resetSignal={transferResetSignal}
                        onSelectActivity={openTransactionDetail}
                      />
                    </ErrorBoundary>
                  )}

                  {section === "recipients" && (
                    <ErrorBoundary>
                      <RecipientsSection
                        onDelete={handleRecipientDeleteCb}
                        onSubmit={handleRecipientCreate}
                        profile={profile}
                        submitting={submitting}
                        resetSignal={recipientResetSignal}
                      />
                    </ErrorBoundary>
                  )}

                  {section === "admin" && scope === "admin" && (
                    <ErrorBoundary>
                      <AdminSection
                        accountTypes={accountTypes}
                        banks={banks}
                        createClientForm={createClientForm}
                        onAccountSynced={handleAccountSynced}
                        onCreateClientFormChange={setCreateClientForm}
                        onSubmit={handleCreateClient}
                        profile={profile}
                        roles={roles}
                        submitting={submitting}
                        totalBalance={formatCurrency(totalBalance)}
                      />
                    </ErrorBoundary>
                  )}
                </Suspense>
              )}
            </>
          )}

          {/*
            Bloque oculto temporalmente — placeholder para futuras features:
              - Tarjeta Orbital: pendiente de wirear con `tarjetas_credito` y consumos.
              - Mapa de integración: documentación inline (movida a CHANGELOG.md).
            No eliminar: cuando se implemente el módulo de tarjetas, descomentar
            la Card de "Tarjeta Orbital" y conectarla al endpoint correspondiente.
          */}
          {/* {!needsProfileCompletion && (
            <section className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Tarjeta Orbital
                  </CardTitle>
                  <CardDescription>Preparada para conectarse con `tarjetas_credito` y consumos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-3xl bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#312E81] p-6 text-white">
                    <p className="text-sm text-white/70">Orbital Infinite</p>
                    <p className="mt-6 font-mono text-2xl tracking-[0.3em]">**** **** **** 2048</p>
                    <div className="mt-6 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-white/60">Titular</p>
                        <p>{profile?.persona.nombre || "Orbital User"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/60">Vence</p>
                        <p>12/29</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    El siguiente paso natural es conectar esta sección con los endpoints de tarjetas y consumos para mostrar límite, disponible y últimos movimientos.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-gradient-to-br from-[#1C0B2E] to-[#2D1548]">
                <CardHeader>
                  <CardTitle>Mapa de integración</CardTitle>
                  <CardDescription>Qué quedó desacoplado y listo para crecer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl bg-[#2D1548]/60 p-4">
                    `src/pages/PortalPage.tsx`: pantalla principal del portal.
                  </div>
                  <div className="rounded-2xl bg-[#2D1548]/60 p-4">
                    `hooks/usePortal*.ts`: datos, formularios y acciones.
                  </div>
                  <div className="rounded-2xl bg-[#2D1548]/60 p-4">
                    `features/*`: API, tipos y secciones de cada dominio.
                  </div>
                </CardContent>
              </Card>
            </section>
          )} */}
        </main>

        {/* Comprobante de transferencia exitosa (estilo banco) */}
        <TransferReceiptDialog
          open={transferReceipt !== null}
          onOpenChange={(o) => { if (!o) setTransferReceipt(null); }}
          transaction={transferReceipt}
        />

        {/* Detalle de un movimiento al tocarlo en la lista */}
        <TransactionDetailDialog
          open={selectedTransaction !== null}
          onOpenChange={(o) => { if (!o) setSelectedTransaction(null); }}
          transaction={selectedTransaction}
          accounts={profile?.cuentas ?? []}
        />
      </div>
    </ProtectedRoute>
  );
}
