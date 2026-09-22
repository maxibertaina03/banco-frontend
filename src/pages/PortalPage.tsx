import { lazy, Suspense } from "react";
import { getSectionItems, roleLabels } from "./portal.config";
import { Header } from "../components/Header";
import { PortalHero } from "../components/layout/PortalHero";
import { PortalSummary } from "../components/layout/PortalSummary";
import { PortalTabs } from "../components/layout/PortalTabs";
import { PortalToolbar } from "../components/layout/PortalToolbar";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { SectionLoader } from "../components/SectionLoader";
import { Card, CardContent } from "../components/ui/card";
import { formatCurrency } from "../lib/utils/currency";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { DialogoComprobanteTransferencia } from "../components/DialogoComprobanteTransferencia";
import { DialogoDetalleTransaccion } from "../components/DialogoDetalleTransaccion";
import { usePortalPage } from "../hooks/usePortalPage";
import { ChatbotWidget } from "../features/chatbot/components/ChatbotWidget";
import { DialogoOrbitaSecreta } from "../features/bonificaciones/DialogoOrbitaSecreta";
import { useOrbitaSecreta } from "../features/bonificaciones/useOrbitaSecreta";

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
const SeccionCambio = lazy(() =>
  import("../features/cambio/sections/SeccionCambio").then((m) => ({ default: m.SeccionCambio }))
);
const SeccionTarjetas = lazy(() =>
  import("../features/tarjetas/sections/SeccionTarjetas").then((m) => ({ default: m.SeccionTarjetas }))
);
const SeccionPrestamos = lazy(() =>
  import("../features/prestamos/sections/SeccionPrestamos").then((m) => ({ default: m.SeccionPrestamos }))
);
const SeccionInversiones = lazy(() =>
  import("../features/inversiones/sections/SeccionInversiones").then((m) => ({ default: m.SeccionInversiones }))
);
const SeccionPagos = lazy(() =>
  import("../features/pagos/sections/SeccionPagos").then((m) => ({ default: m.SeccionPagos }))
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
    totalUsd,
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
    handleLoadPersona,
    handleCopyCbu,
    handleCopyAlias,
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
    cuentaPrincipal,
  } = usePortalPage();

  // Si encontró la órbita secreta en el login, se cobra acá. Espera al perfil
  // completo: sin DNI no se le puede abrir la caja en dólares.
  const orbitaSecreta = useOrbitaSecreta(Boolean(perfil) && !necesitaCompletarPerfil && !loading);

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
                totalUsdLabel={totalUsd !== null ? formatCurrency(totalUsd, "USD") : null}
                cbu={cuentaPrincipal?.cbu}
                alias={cuentaPrincipal?.alias}
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
                        onIr={setSection}
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

                  {section === "pagos" && (
                    <ErrorBoundary>
                      <SeccionPagos perfil={perfil} />
                    </ErrorBoundary>
                  )}

                  {section === "cambio" && (
                    <ErrorBoundary>
                      <SeccionCambio perfil={perfil} onIrACuentas={manejarIrACuentas} />
                    </ErrorBoundary>
                  )}

                  {section === "tarjetas" && (
                    <ErrorBoundary>
                      <SeccionTarjetas perfil={perfil} />
                    </ErrorBoundary>
                  )}

                  {section === "prestamos" && (
                    <ErrorBoundary>
                      <SeccionPrestamos perfil={perfil} />
                    </ErrorBoundary>
                  )}

                  {section === "inversiones" && (
                    <ErrorBoundary>
                      <SeccionInversiones perfil={perfil} />
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

        </main>

        {/* Comprobante de transferencia exitosa (estilo banco) */}
        <DialogoComprobanteTransferencia
          open={comprobanteTransferencia !== null}
          onOpenChange={(o) => { if (!o) setComprobanteTransferencia(null); }}
          comprobante={comprobanteTransferencia}
        />

        {/* Detalle de un movimiento al tocarlo en la lista */}
        <DialogoDetalleTransaccion
          open={transaccionSeleccionada !== null}
          onOpenChange={(o) => { if (!o) setTransaccionSeleccionada(null); }}
          transaccion={transaccionSeleccionada}
          perfil={perfil}
        />

        <DialogoOrbitaSecreta estado={orbitaSecreta.estado} onCerrar={orbitaSecreta.cerrar} />

        {!necesitaCompletarPerfil && <ChatbotWidget />}
      </div>
    </ProtectedRoute>
  );
}
