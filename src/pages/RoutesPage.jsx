import { Link } from 'react-router-dom';
import ImportKmz from '../components/ImportKmz.jsx';
import { useRoutes, deleteRoute } from '../store/useRoutes.js';
import { fmtKm, fmtM } from '../lib/geo.js';

export default function RoutesPage() {
  const { routes } = useRoutes();

  return (
    <>
      <div className="toolbar">
        <h2 style={{ margin: 0 }}>Rutas</h2>
        <div className="spacer" />
        <ImportKmz />
      </div>

      {routes.length === 0 ? (
        <div className="empty">
          Todavía no importaste ninguna ruta. Hacé click en <b>Importar KMZ/KML</b> y elegí un archivo
          exportado desde Google Earth.
        </div>
      ) : (
        <div className="route-list">
          {routes
            .slice()
            .sort((a, b) => b.importedAt.localeCompare(a.importedAt))
            .map((r) => (
              <RouteRow key={r.id} route={r} />
            ))}
        </div>
      )}
    </>
  );
}

function RouteRow({ route }) {
  const isTrip = route.type === 'trip';
  return (
    <div className="route-row">
      <Link to={`/rutas/${route.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
        <div className="name">
          {route.name}
          {isTrip && (
            <span className="badge warn" style={{ marginLeft: 8 }}>
              viaje {route.tripMeta?.days || 2}d{route.tripMeta?.extraLoadKg ? ` +${route.tripMeta.extraLoadKg}kg` : ''}
            </span>
          )}
        </div>
        <div className="meta">
          {route.points.length} puntos · importada {new Date(route.importedAt).toLocaleDateString()}
        </div>
      </Link>
      <div className="meta">{fmtKm(route.stats.distance_m)}</div>
      <div className="meta">+{fmtM(route.stats.gain_m)}</div>
      <div className="meta">−{fmtM(route.stats.loss_m)}</div>
      <button
        className="danger"
        onClick={() => {
          if (confirm(`¿Eliminar "${route.name}"?`)) deleteRoute(route.id);
        }}
      >
        Eliminar
      </button>
    </div>
  );
}
