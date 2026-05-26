import { useState } from 'react';
import ComponentsList from '../components/ComponentsList.jsx';
import GearTable from '../components/GearTable.jsx';
import BikeSpecForm from '../components/BikeSpecForm.jsx';
import { TopoBg } from '../components/atoms.jsx';

const TABS = [
  { id: 'components', label: 'Componentes', num: '01' },
  { id: 'gearing',    label: 'Desarrollos', num: '02' },
  { id: 'specs',      label: 'Specs',       num: '03' },
];

export default function Bike() {
  const [tab, setTab] = useState('components');

  return (
    <div className="page-inner">
      <TopoBg />
      <div style={{ position: 'relative' }}>
        <div className="page-header">
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>04 · Mantenimiento + setup</div>
            <div className="title">Mi bicicleta<em>.</em></div>
            <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
              Seguimiento de componentes, desarrollos y ficha técnica.
            </div>
          </div>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              <span className="num">{t.num}</span>{t.label}
            </button>
          ))}
        </div>

        {tab === 'components' && <ComponentsList />}
        {tab === 'gearing'    && <GearTable />}
        {tab === 'specs'      && <BikeSpecForm />}
      </div>
    </div>
  );
}
