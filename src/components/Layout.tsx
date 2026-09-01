import { Link, Outlet, useLocation } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { to: '/', label: 'Candidaturas' },
  { to: '/profile', label: 'Perfil' },
];

// Layout general: cabecera de navegacion + el contenido de cada pagina
// se renderiza en <Outlet/>. Usamos buttonVariants (no <Button> directamente)
// porque queremos que cada enlace sea un <Link> de react-router con el
// mismo aspecto visual que un boton de shadcn.
export function Layout() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-3">
          <span className="mr-4 font-semibold">Job Assistant</span>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                buttonVariants({
                  variant: location.pathname === item.to ? 'default' : 'ghost',
                }),
                'h-9'
              )}
            >
              {item.label}
            </Link>
          ))}
          <Button variant="ghost" className="ml-auto h-9" onClick={logout}>
            Cerrar sesion
        </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}