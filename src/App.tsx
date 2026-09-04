import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { KanbanBoard } from './pages/KanbanBoard';
import { ApplicationDetail } from './pages/ApplicationDetail';
import { Profile } from './pages/Profile';
import { Toaster } from '@/components/ui/sonner';
import { Metrics } from './pages/Metrics';
import { JobSearch } from './pages/JobSearch';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<KanbanBoard />} />
              <Route path="/applications/:id" element={<ApplicationDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/metrics" element={<Metrics />} />
              <Route path="/search" element={<JobSearch />} />
            </Route>
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}