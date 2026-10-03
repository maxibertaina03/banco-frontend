import { useState } from "react";
import { ShieldCheck, Trash2, UserCog } from "lucide-react";
import {
  Aviso,
  Boton,
  Campo,
  Entrada,
  Panel,
  Select,
  Vacio,
  mensajeDeError,
} from "../../../components/operaciones/ui";
import {
  useAsignarRol,
  useCatalogoDeRoles,
  useQuitarRol,
  useRolesDePersona,
} from "../../../lib/queries";
import type { OpcionDePersona } from "../../personas/types/personas.types";

/** Qué puede hacer cada rol, en una línea, para no tener que adivinar. */
const QUE_HACE: Record<string, string> = {
  cliente: "Opera sus propias cuentas. Es el rol de cualquier titular.",
  admin: "Todo, incluido repartir roles y las credenciales del Banco Central.",
  operador: "Gestión comercial: depósitos, extracciones y datos de clientes.",
  tesoreria: "Manejo de fondos: depósitos, extracciones y cierres.",
  gerente: "Aprueba o rechaza los préstamos que no pasan el filtro automático.",
  auditor: "Lee la trazabilidad de cualquier usuario. No puede operar.",
};

/**
 * Asignar y quitar roles.
 *
 * Sólo lo ve el administrador, y el backend lo exige además: repartir roles es
 * repartir permisos, y un operador podría haberse hecho admin a sí mismo.
 */
export function GestionDeRoles({ personas }: { personas: OpcionDePersona[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [personaId, setPersonaId] = useState<string | null>(null);

  const catalogo = useCatalogoDeRoles(true);
  const asignaciones = useRolesDePersona(personaId);
  const asignar = useAsignarRol();
  const quitar = useQuitarRol();

  const termino = busqueda.trim().toLowerCase();
  const encontradas = termino
    ? personas.filter((p) =>
        `${p.nombre} ${p.apellido} ${p.email} ${p.dni ?? ""}`.toLowerCase().includes(termino)
      )
    : [];

  const persona = personas.find((p) => p.id === personaId) ?? null;
  // Los roles que la persona todavía no tiene.
  const yaTiene = new Set(asignaciones.data?.map((a) => a.rol_id));
  const disponibles = catalogo.data?.filter((rol) => !yaTiene.has(rol.id)) ?? [];
  const [rolAAsignar, setRolAAsignar] = useState("");

  return (
    <Panel
      title="Roles de usuario"
      description="Buscá a una persona y ajustá qué puede hacer dentro del banco."
    >
      {catalogo.isError && <Aviso tipo="error">{mensajeDeError(catalogo.error)}</Aviso>}

      <Campo label="Buscar persona" hint="Por nombre, apellido, correo o DNI">
        <Entrada
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Escribí para buscar…"
        />
      </Campo>

      {termino && !persona && (
        <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto">
          {encontradas.length === 0 && <Vacio>Nadie coincide con «{busqueda}».</Vacio>}
          {encontradas.slice(0, 12).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPersonaId(p.id);
                setRolAAsignar("");
              }}
              className="rounded-xl border border-primary/15 bg-[#2D1548]/40 px-4 py-3 text-left transition hover:bg-[#2D1548]/70"
            >
              <p className="text-sm text-white">
                {p.nombre} {p.apellido}
              </p>
              <p className="text-xs text-muted-foreground">
                {p.email} · DNI {p.dni ?? "—"}
              </p>
            </button>
          ))}
        </div>
      )}

      {persona && (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-[#2D1548]/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-medium text-white">
                <UserCog className="h-4 w-4 text-primary" />
                {persona.nombre} {persona.apellido}
              </p>
              <p className="text-xs text-muted-foreground">{persona.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPersonaId(null);
                setBusqueda("");
              }}
              className="text-xs text-muted-foreground underline"
            >
              Buscar otra
            </button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">Roles que tiene hoy</p>
          {asignaciones.isLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">Cargando…</p>
          ) : asignaciones.data?.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Ninguno todavía.</p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {asignaciones.data?.map((asignacion) => {
                const rol = catalogo.data?.find((r) => r.id === asignacion.rol_id);
                const nombre = rol?.nombre ?? "rol desconocido";
                return (
                  <li
                    key={asignacion.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-[#1C0B2E] px-4 py-2.5"
                  >
                    <div>
                      <p className="flex items-center gap-2 text-sm capitalize text-white">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        {nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {QUE_HACE[nombre] ?? rol?.descripcion ?? ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => quitar.mutate({ asignacionId: asignacion.id })}
                      disabled={quitar.isPending}
                      aria-label={`Quitar el rol ${nombre}`}
                      className="shrink-0 rounded-lg p-2 text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {(asignar.isError || quitar.isError) && (
            <div className="mt-3">
              <Aviso tipo="error">{mensajeDeError(asignar.error || quitar.error)}</Aviso>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Campo
              label="Agregar un rol"
              hint={
                rolAAsignar
                  ? QUE_HACE[catalogo.data?.find((r) => r.id === rolAAsignar)?.nombre ?? ""]
                  : "Elegí uno para ver qué habilita"
              }
            >
              <Select value={rolAAsignar} onChange={(e) => setRolAAsignar(e.target.value)}>
                <option value="">Elegir…</option>
                {disponibles.map((rol) => (
                  <option key={rol.id} value={rol.id} className="capitalize">
                    {rol.nombre}
                  </option>
                ))}
              </Select>
            </Campo>
            <Boton
              cargando={asignar.isPending}
              disabled={!rolAAsignar}
              onClick={() => {
                asignar.mutate(
                  { personaId: persona.id, rolId: rolAAsignar },
                  { onSuccess: () => setRolAAsignar("") }
                );
              }}
            >
              Asignar
            </Boton>
          </div>

          {disponibles.length === 0 && !asignaciones.isLoading && (
            <p className="mt-2 text-xs text-muted-foreground">Ya tiene todos los roles del banco.</p>
          )}
        </div>
      )}
    </Panel>
  );
}
