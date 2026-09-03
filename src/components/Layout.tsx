import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Candidaturas' },
  { to: '/metrics', label: 'Metricas' },
  { to: '/profile', label: 'Perfil' },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', compact ? 'px-4 py-4' : 'px-5 py-6')}>
      <img src="/favicon.svg" alt="" className={compact ? 'size-7' : 'size-9'} />
      <span className={cn('font-display', compact ? 'text-base' : 'text-xl')}>Job Helper</span>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV_ITEMS.map((item) => {
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              'rounded-sm border-l-2 px-3 py-2 text-sm transition-colors',
              active
                ? 'border-sidebar-foreground bg-sidebar-accent'
                : 'border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="border-t border-sidebar-accent p-4">
      <button
        onClick={onLogout}
        className="flex w-full items-center gap-2 rounded-sm border border-sidebar-accent px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:border-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <LogOut className="size-4" />
        Cerrar sesion
      </button>
    </div>
  );
}

export function Layout() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Barra superior - solo movil/tablet */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="size-6" />
          <span className="font-display text-base">Job Helper</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent" />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex w-64 flex-col border-0 bg-sidebar p-0 text-sidebar-foreground"
          >
            <Brand />
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto">
              <LogoutButton onLogout={logout} />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Barra lateral fija - solo escritorio. sticky + h-screen: se ancla
          a la altura del viewport en vez de estirarse con el contenido de
          la pagina, asi el boton de cerrar sesion siempre queda visible al
          fondo, sin importar si el formulario de la pagina activa es largo. */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:bg-sidebar lg:text-sidebar-foreground">
        <Brand />
        <NavLinks />
        <div className="mt-auto">
          <LogoutButton onLogout={logout} />
        </div>
      </aside>

      {/* min-w-0: evita que el contenido interior (p.ej. el tablero Kanban)
          fuerce el ancho de toda la pagina y provoque scroll horizontal
          a nivel de documento en vez de quedar contenido en su propia caja. */}
      <main className="min-w-0 flex-1 bg-background">
        <Outlet />
      </main>
    </div>
  );
}
