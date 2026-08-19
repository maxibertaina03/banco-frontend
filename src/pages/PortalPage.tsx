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
import { DialogoComprobanteTransferencia } from "../components/DialogoComprobanteTransferencia";
import { DialogoDetalleTransaccion } from "../components/DialogoDetalleTransaccion";
import { usePortalPage } from "../hooks/usePortalPage";

// Sections cargadas perezosamente: cada una se descarga en su propio chunk
// cuando el usuario navega a esa tab. Beneficio principal: el cliente normal
// nunca descarga AdminSection (~30 KB con su árbol).
// Vite admite la forma `import(...).then(m => ({ default: m.Named }))` para
// re-exportar un named export como default sin tocar el archivo origen.
const SeccionCuentas = lazy(() =>
  import("../features/cuentas/sections/SeccionCuentas").then((m) => ({ default: m.SeccionCuentas }))
);
const AdminSection = lazy(() =>
  import("../features/admin/sections/AdminSection").then((m) => ({ default: m.AdminSection }))
);
const SeccionCompletarPerfil = lazy(() =>
  import("../features/personas/sections/SeccionCompletarPerfil").then((m) => ({
    default: m.SeccionCompletarPerfil,
  }))
);
const DashboardSection = lazy(() =>
  import("../features/dashboard/sections/DashboardSection").then((m) => ({ default: m.DashboardSection }))
);
const SeccionDestinatarios = lazy(() =>
  import("../features/destinatarios/sections/SeccionDestinatarios").then((m) => ({
    default: m.SeccionDestinatarios,
  }))
);
const SeccionTransacciones = lazy(() =>
  import("../features/transacciones/sections/SeccionTransacciones").then((m) => ({
    default: m.SeccionTransacciones,
  }))
);

export function PortalPage() {
  const {
    rolActivo,
    setRolActivo,
    section,
    setSection,
    error,
    setError,
    success,
    setSuccess,
    perfilAutenticado,
    perfil,
    loading,
    necesitaCompletarPerfil,
    warning,
    scope,
    totalBalance,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createClientForm,
    setCreateClientForm,
    cuentaSeleccionadaParaAlias,
    setCuentaSeleccionadaParaAlias,
    submitting,
    personas,
    selectedPersonaId,
    roleOptions,
    tiposDeCuenta,
    banks,
    manualPersonaId,
    setManualPersonaId,
    activities,
    tiposDeTransaccion,
    roles,
    bulkSyncing,
    lastSyncResult,
    contadorResetDestinatario,
    idCuentaSincronizando,
    syncingIncoming,
    contadorResetTransferencia,
    manejarIrACuentas,
    handleGoToActivity,
    handleGoToContacts,
    manejarIrATransacciones,
    handleLoadPersona,
    handleCopyCbu,
    handleCopyAlias,
    handleIncome,
    handleAliasUpdated,
    manejarSincronizarCuentaCb,
    handleBulkSyncCb,
    handleSyncIncomingCb,
    manejarEliminarDestinatarioCb,
    manejarCuentaSincronizada,
    manejarCompletarPerfil,
    handleCreateClient,
    manejarCrearDestinatario,
    manejarTransferir,
    refrescarDestinatarios,
    refrescarDatosDePersona,
    comprobanteTransferencia,
    setComprobanteTransferencia,
    transaccionSeleccionada,
    setTransaccionSeleccionada,
    abrirDetalleDeTransaccion,
  } = usePortalPage();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header
          displayName={
            perfil
              ? `${perfil.persona.nombre} ${perfil.persona.apellido}`
              : perfilAutenticado
                ? `${perfilAutenticado.nombre} ${perfilAutenticado.apellido}`.trim() || "Orbital"
                : "Orbital"
          }
          perfilAutenticado={perfilAutenticado}
          personaId={perfil?.persona.id}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {!necesitaCompletarPerfil && (
            <section className="mb-8 grid gap-6 lg:grid-cols-[1.45fr_0.55fr]">
              <PortalHero
                rolActivo={rolActivo}
                onRoleChange={setRolActivo}
                roleLabels={roleLabels}
                roleOptions={roleOptions}
              />
              <PortalSummary
                cantidadCuentasActivas={perfil?.cuentas.filter((cuenta) => cuenta.activa).length || 0}
                totalBalanceLabel={formatCurrency(totalBalance)}
                cbu={perfil?.cuentas[0]?.cbu}
                alias={perfil?.cuentas[0]?.alias}
                onCopyCbu={handleCopyCbu}
                onCopyAlias={handleCopyAlias}
              />
            </section>
          )}

          {!necesitaCompletarPerfil && (
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

          {necesitaCompletarPerfil ? (
            <Suspense fallback={<SectionLoader />}>
              <SeccionCompletarPerfil
                perfilAutenticado={perfilAutenticado}
                submitting={submitting}
                onSubmit={manejarCompletarPerfil}
              />
            </Suspense>
          ) : (
            <>
              <PortalTabs items={getSectionItems(scope)} onSectionChange={setSection} section={section} />

              {loading || !perfil ? (
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
                        onCuentas={manejarIrACuentas}
                        onActivity={handleGoToActivity}
                        onContacts={handleGoToContacts}
                        onIncome={handleIncome}
                        onTransferir={manejarIrATransacciones}
                        onSelectActivity={abrirDetalleDeTransaccion}
                      />
                    </ErrorBoundary>
                  )}

                  {section === "cuentas" && (
                    <ErrorBoundary>
                      <SeccionCuentas
                        perfil={perfil}
                        cuentaSeleccionadaParaAlias={cuentaSeleccionadaParaAlias}
                        onAliasEdit={setCuentaSeleccionadaParaAlias}
                        onAliasUpdated={handleAliasUpdated}
                        onSincronizarCuenta={scope === "admin" ? manejarSincronizarCuentaCb : undefined}
                        onBulkSync={scope === "admin" ? handleBulkSyncCb : undefined}
                        idCuentaSincronizando={idCuentaSincronizando}
                        bulkSyncing={bulkSyncing}
                      />
                    </ErrorBoundary>
                  )}

                  {section === "transacciones" && (
                    <ErrorBoundary>
                      <SeccionTransacciones
                        activities={activities}
                        lastSyncResult={lastSyncResult}
                        loading={loading}
                        onSubmit={manejarTransferir}
                        onSyncIncoming={handleSyncIncomingCb}
                        perfil={perfil}
                        submitting={submitting}
                        syncingIncoming={syncingIncoming}
                        resetSignal={contadorResetTransferencia}
                        onSelectActivity={abrirDetalleDeTransaccion}
                      />
                    </ErrorBoundary>
                  )}

                  {section === "destinatarios" && (
                    <ErrorBoundary>
                      <SeccionDestinatarios
                        onDelete={manejarEliminarDestinatarioCb}
                        onSubmit={manejarCrearDestinatario}
                        perfil={perfil}
                        submitting={submitting}
                        resetSignal={contadorResetDestinatario}
                      />
                    </ErrorBoundary>
                  )}

                  {section === "admin" && scope === "admin" && (
                    <ErrorBoundary>
                      <AdminSection
                        tiposDeCuenta={tiposDeCuenta}
                        banks={banks}
                        createClientForm={createClientForm}
                        onCuentaSincronizada={manejarCuentaSincronizada}
                        onCreateClientFormChange={setCreateClientForm}
                        onSubmit={handleCreateClient}
                        perfil={perfil}
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
          {/* {!necesitaCompletarPerfil && (
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
                        <p>{perfil?.persona.nombre || "Orbital User"}</p>
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
        <DialogoComprobanteTransferencia
          open={comprobanteTransferencia !== null}
          onOpenChange={(o) => { if (!o) setComprobanteTransferencia(null); }}
          transaccion={comprobanteTransferencia}
        />

        {/* Detalle de un movimiento al tocarlo en la lista */}
        <DialogoDetalleTransaccion
          open={transaccionSeleccionada !== null}
          onOpenChange={(o) => { if (!o) setTransaccionSeleccionada(null); }}
          transaccion={transaccionSeleccionada}
          perfil={perfil}
        />
      </div>
    </ProtectedRoute>
  );
}
