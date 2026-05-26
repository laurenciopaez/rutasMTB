import { useState } from 'react';
import { usePreferences, savePreferences } from '../store/usePreferences.js';

const ACCENTS = ['moss', 'rust', 'cobalt', 'ink'];
const DENSITIES = ['comfortable', 'compact'];

export default function PreferencesPanel() {
  const prefs = usePreferences();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="prefs-trigger"
        title="Ajustes visuales"
        aria-label="Ajustes visuales"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '×' : '⚙'}
      </button>

      {open && (
        <div className="prefs-panel" role="dialog">
          <h4>Aspecto</h4>

          <div className="prefs-row">
            <span className="lbl">Acento</span>
            <div className="prefs-seg">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  className={prefs.accent === a ? 'active' : ''}
                  onClick={() => savePreferences({ accent: a })}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="prefs-row">
            <span className="lbl">Densidad</span>
            <div className="prefs-seg">
              {DENSITIES.map((d) => (
                <button
                  key={d}
                  className={prefs.density === d ? 'active' : ''}
                  onClick={() => savePreferences({ density: d })}
                >
                  {d === 'comfortable' ? 'cómoda' : 'compacta'}
                </button>
              ))}
            </div>
          </div>

          <div className="prefs-toggle">
            <span>Contornos topográficos</span>
            <button
              className="prefs-switch"
              data-on={prefs.showTopo ? '1' : '0'}
              aria-checked={!!prefs.showTopo}
              role="switch"
              onClick={() => savePreferences({ showTopo: !prefs.showTopo })}
            >
              <i />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
