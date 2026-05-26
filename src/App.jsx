import { useEffect } from 'react';
import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import RoutesPage from './pages/RoutesPage.jsx';
import RouteDetail from './pages/RouteDetail.jsx';
import Trainings from './pages/Trainings.jsx';
import Bike from './pages/Bike.jsx';
import Profile from './pages/Profile.jsx';
import PreferencesPanel from './components/PreferencesPanel.jsx';
import { usePreferences, applyPreferences } from './store/usePreferences.js';
import { useProfile } from './store/useProfile.js';
import { useTrainings } from './store/useTrainings.js';
import { computeFitness, levelLabel, formLabel } from './lib/fitness.js';

const NAV = [
  { to: '/dashboard',      label: 'Dashboard',      num: '01' },
  { to: '/rutas',          label: 'Rutas',          num: '02' },
  { to: '/entrenamientos', label: 'Entrenamientos', num: '03' },
  { to: '/bici',           label: 'Mi bicicleta',   num: '04' },
  { to: '/perfil',         label: 'Perfil',         num: '05' },
];

export default function App() {
  const prefs = usePreferences();
  useEffect(() => { applyPreferences(prefs); }, [prefs]);

  return (
    <div className="app">
      <Sidebar />
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
      <PreferencesPanel />
    </div>
  );
}

function Sidebar() {
  const profile = useProfile();
  const trainings = useTrainings();
  const fitness = computeFitness(trainings, profile);
  const fForm = formLabel(fitness.TSB);

  const formColor =
    fForm.tone === 'ok' ? 'var(--forest)'
    : fForm.tone === 'warn' ? 'var(--ochre)'
    : fForm.tone === 'danger' ? 'var(--rust)'
    : 'var(--sky)';

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">Rutas<em>MTB</em></div>
        <div className="sub">bitácora · v0.4</div>
      </div>
      <div className="brand-rule" />

      <div className="side-section">
        <div className="eyebrow">Secciones</div>
      </div>

      <nav>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="num">{n.num}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="side-foot">
        <div className="eyebrow">Estado actual</div>
        {fitness.level > 0 ? (
          <>
            <span className="stamp">
              <span className="dot" />Nivel {fitness.level} · {levelLabel(fitness.level)}
            </span>
            <span className="stamp" style={{ borderStyle: 'solid' }}>
              <span className="dot" style={{ background: formColor }} />
              {fForm.label}
            </span>
          </>
        ) : (
          <span className="stamp">
            <span className="dot" style={{ background: 'var(--ink-dim)' }} />
            sin actividad
          </span>
        )}
        {profile.name && (
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.08em', marginTop: 4, textTransform: 'uppercase' }}>
            {profile.name}
          </div>
        )}
      </div>
    </aside>
  );
}
