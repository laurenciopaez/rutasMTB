import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import RoutesPage from './pages/RoutesPage.jsx';
import RouteDetail from './pages/RouteDetail.jsx';
import Trainings from './pages/Trainings.jsx';
import Bike from './pages/Bike.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h1>RutasMTB</h1>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/rutas" className={({ isActive }) => (isActive ? 'active' : '')}>
            Rutas
          </NavLink>
          <NavLink to="/entrenamientos" className={({ isActive }) => (isActive ? 'active' : '')}>
            Entrenamientos
          </NavLink>
          <NavLink to="/bici" className={({ isActive }) => (isActive ? 'active' : '')}>
            Mi bicicleta
          </NavLink>
          <NavLink to="/perfil" className={({ isActive }) => (isActive ? 'active' : '')}>
            Perfil
          </NavLink>
        </nav>
      </aside>
      <main className="page">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rutas" element={<RoutesPage />} />
          <Route path="/rutas/:id" element={<RouteDetail />} />
          <Route path="/entrenamientos" element={<Trainings />} />
          <Route path="/bici" element={<Bike />} />
          <Route path="/perfil" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}
