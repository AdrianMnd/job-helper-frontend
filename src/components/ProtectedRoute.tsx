import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Envuelve las rutas que requieren sesion. Si no hay token, redirige a /login
// en vez de dejar que la pagina intente llamar a la API y falle con un 401.
export function ProtectedRoute() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}