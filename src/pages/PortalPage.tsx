import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { CreditCard } from "lucide-react";
import { getSectionItems, roleLabels, type Section } from "./portal.config";
import { Header } from "../components/Header";
import { PortalHero } from "../components/layout/PortalHero";
import { PortalSummary } from "../components/layout/PortalSummary";
import { PortalTabs } from "../components/layout/PortalTabs";
import { PortalToolbar } from "../components/layout/PortalToolbar";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { PREFERRED_PERSONA_ID } from "../lib/constants/portal";
import { formatCurrency } from "../lib/utils/currency";
import { AccountsSection } from "../features/cuentas/sections/AccountsSection";
import { DashboardSection } from "../features/dashboard/sections/DashboardSection";
import { RecipientsSection } from "../features/destinatarios/sections/RecipientsSection";
import { getRoleOptions, getRoleScope, sanitizePersonaId } from "../features/personas/api/personas.api";
import { CompleteProfileSection } from "../features/personas/sections/CompleteProfileSection";
import type { PortalRole } from "../features/personas/types/personas.types";
import { TransactionsSection } from "../features/transacciones/sections/TransactionsSection";
import { AdminSection } from "../features/admin/sections/AdminSection";
import { usePortalActions } from "../hooks/usePortalActions";
import { usePortalData } from "../hooks/usePortalData";
import { usePortalForms } from "../hooks/usePortalForms";

export function PortalPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const initialPersonaId = sanitizePersonaId(PREFERRED_PERSONA_ID);
  const [activeRole, setActiveRole] = useState<PortalRole>("cliente");
  const [section, setSection] = useState<Section>("dashboard");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    accountTypes,
    activities,
    authProfile,
    auditCount,
    loadPortal,
    loading,
    manualPersonaId,
    needsProfileCompletion,
    personas,
    profile,
    roles,
    selectedPersonaId,
    setManualPersonaId,
    setSelectedPersonaId,
    transactionTypes,
    warning,
  } = usePortalData({
    getToken,
    initialPersonaId,
    isLoaded,
    isSignedIn,
    preferredPersonaId: PREFERRED_PERSONA_ID,
    setError,
    setSuccess,
  });
  const {
    completeProfileForm,
    createClientForm,
    profileForm,
    recipientForm,
    selectedAccountForAlias,
    setCompleteProfileForm,
    setCreateClientForm,
    setProfileForm,
    setRecipientForm,
    setSelectedAccountForAlias,
    setTransferForm,
    transferForm,
  } = usePortalForms(profile, transactionTypes, authProfile);

  const roleOptions = useMemo(() => (profile ? getRoleOptions(profile) : ["cliente"]), [profile]);
  const scope = getRoleScope(activeRole);
  const totalBalance = useMemo(
    () => profile?.cuentas.reduce((sum, account) => sum + Number(account.saldo || 0), 0) || 0,
    [profile]
  );
  const {
    handleCompleteProfile,
    handleCreateClient,
    handleProfileSave,
    handleRecipientCreate,
    handleRecipientDelete,
    handleTransfer,
  } = usePortalActions({
    completeProfileForm,
    createClientForm,
    loadPortal,
    profile,
    profileForm,
    recipientForm,
    setCreateClientForm,
    setError,
    setRecipientForm,
    setSubmitting,
    setSuccess,
    setTransferForm,
    transferForm,
  });

  useEffect(() => {
    if (scope === "user" && section === "admin") {
      setSection("dashboard");
    }
  }, [scope, section]);

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
                auditCount={auditCount}
                totalBalanceLabel={formatCurrency(totalBalance)}
              />
            </section>
          )}

          {!needsProfileCompletion && (
            <PortalToolbar
              loading={loading}
              manualPersonaId={manualPersonaId}
              onLoadPersona={(personaId) => void loadPortal(personaId)}
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
            <CompleteProfileSection
              form={completeProfileForm}
              submitting={submitting}
              onChange={setCompleteProfileForm}
              onSubmit={handleCompleteProfile}
            />
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
                <>
                  {section === "dashboard" && (
                    <DashboardSection
                      activities={activities}
                      loading={loading}
                      profile={profile}
                      profileForm={profileForm}
                      submitting={submitting}
                      onAccounts={() => setSection("accounts")}
                      onActivity={() => setSection("transactions")}
                      onContacts={() => setSection("recipients")}
                      onCopyCbu={() => {
                        const cbu = profile.cuentas[0]?.cbu;
                        if (cbu) {
                          void navigator.clipboard.writeText(cbu);
                          setSuccess("CBU copiado al portapapeles.");
                        }
                      }}
                      onIncome={() => void loadPortal(profile.persona.id)}
                      onProfileFormChange={setProfileForm}
                      onProfileSave={handleProfileSave}
                      onTransfer={() => setSection("transactions")}
                    />
                  )}

                  {section === "accounts" && (
                    <AccountsSection
                      profile={profile}
                      selectedAccountForAlias={selectedAccountForAlias}
                      onAliasEdit={setSelectedAccountForAlias}
                      onAliasUpdated={() => {
                        setSuccess("Alias actualizado correctamente.");
                        setSelectedAccountForAlias(null);
                        void loadPortal(profile.persona.id);
                      }}
                    />
                  )}

                  {section === "transactions" && (
                    <TransactionsSection
                      activities={activities}
                      loading={loading}
                      onSubmit={handleTransfer}
                      onTransferFormChange={setTransferForm}
                      profile={profile}
                      submitting={submitting}
                      transactionTypes={transactionTypes}
                      transferForm={transferForm}
                    />
                  )}

                  {section === "recipients" && (
                    <RecipientsSection
                      onDelete={(recipient) => void handleRecipientDelete(recipient.id)}
                      onRecipientFormChange={setRecipientForm}
                      onSubmit={handleRecipientCreate}
                      profile={profile}
                      recipientForm={recipientForm}
                      submitting={submitting}
                    />
                  )}

                  {section === "admin" && scope === "admin" && (
                    <AdminSection
                      accountTypes={accountTypes}
                      createClientForm={createClientForm}
                      onCreateClientFormChange={setCreateClientForm}
                      onSubmit={handleCreateClient}
                      profile={profile}
                      roles={roles}
                      submitting={submitting}
                      totalBalance={formatCurrency(totalBalance)}
                    />
                  )}
                </>
              )}
            </>
          )}

          {!needsProfileCompletion && (
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
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
