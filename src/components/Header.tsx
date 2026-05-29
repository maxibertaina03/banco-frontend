import { useState } from "react";
import { Bell, ChevronDown, LogOut, Menu, User as UserIcon } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import logo from "../imports/image-3.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { EditProfileDialog } from "./EditProfileDialog";
import type { NotificationItem } from "../hooks/useNotifications";
import type { AuthenticatedUserProfile } from "../features/personas/types/personas.types";

interface HeaderProps {
  displayName?: string;
  authProfile: AuthenticatedUserProfile | null;
  personaId: string | null | undefined;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

function getInitials(profile: AuthenticatedUserProfile | null, fallback: string): string {
  if (profile) {
    const first = profile.nombre?.[0] ?? "";
    const second = profile.apellido?.[0] ?? "";
    const combined = (first + second).trim();
    if (combined) return combined.toUpperCase();
  }
  const trimmed = fallback.trim();
  if (!trimmed) return "U";
  const parts = trimmed.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Header({
  displayName = "Mi cuenta",
  authProfile,
  personaId,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: HeaderProps) {
  const { signOut } = useClerk();
  const [editOpen, setEditOpen] = useState(false);

  const initials = getInitials(authProfile, displayName);
  const fullName = authProfile
    ? `${authProfile.nombre ?? ""} ${authProfile.apellido ?? ""}`.trim() || displayName
    : displayName;

  return (
    <>
      <header className="border-b border-primary/20 bg-[#1C0B2E]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <button className="lg:hidden p-2 rounded-lg hover:bg-[#2D1548] transition-colors">
                <Menu className="w-5 h-5" />
              </button>
              <img src={logo} alt="Orbital" className="h-9 object-contain" />
            </div>

            <div className="flex items-center gap-2">
              {/* Notificaciones */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative p-2 rounded-lg hover:bg-[#2D1548] transition-colors"
                    aria-label="Notificaciones"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#A855F7] px-1 text-[10px] font-medium text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 max-h-[420px] overflow-y-auto bg-[#1C0B2E] border-primary/20"
                >
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-medium">Notificaciones</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={onMarkAllAsRead}
                        className="text-xs text-primary hover:underline"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  <DropdownMenuSeparator />

                  {notifications.length === 0 ? (
                    <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                      No tenés notificaciones por ahora.
                    </div>
                  ) : (
                    <div className="py-1">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => onMarkAsRead(n.id)}
                          className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left transition hover:bg-[#2D1548] ${
                            n.read ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-sm">
                              {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-[#A855F7]" />}
                              {n.title}
                            </span>
                            <span className="text-sm font-medium text-emerald-300">{n.amountLabel}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{n.recipient}</p>
                          <p className="text-[10px] text-muted-foreground/80">{n.date}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Menú de perfil */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#2D1548] transition-colors">
                    <span className="hidden sm:inline text-sm">{fullName}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#A855F7] to-[#7C3AED] text-xs font-medium text-white">
                      {initials}
                    </div>
                    <ChevronDown className="hidden sm:block h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1C0B2E] border-primary/20">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm">{fullName}</span>
                      {authProfile?.email && (
                        <span className="text-xs text-muted-foreground truncate">{authProfile.email}</span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Mis datos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      void signOut();
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={authProfile}
        personaId={personaId}
      />
    </>
  );
}
