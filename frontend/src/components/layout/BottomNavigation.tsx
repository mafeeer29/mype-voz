import { NavLink } from "react-router-dom";
import { Home, PlusCircle, Package, Wallet, MessageCircle } from "lucide-react";

const items = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/registrar", label: "Registrar", icon: PlusCircle, end: false },
  { to: "/inventario", label: "Inventario", icon: Package, end: false },
  { to: "/deudas", label: "Deudas", icon: Wallet, end: false },
  { to: "/asistente", label: "Asistente", icon: MessageCircle, end: false },
];

export function BottomNavigation() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-surface-elevated border-t border-line"
      aria-label="Navegación principal"
    >
      <div className="mx-auto max-w-md grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] transition-colors ${
                isActive
                  ? "text-primary-700"
                  : "text-ink-muted hover:text-ink-soft"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
                <span className="text-[11px] font-medium leading-none">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
