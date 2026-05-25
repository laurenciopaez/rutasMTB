import { useState } from 'react';
import ComponentsList from '../components/ComponentsList.jsx';
import GearTable from '../components/GearTable.jsx';
import BikeSpecForm from '../components/BikeSpecForm.jsx';

const TABS = [
  { id: 'components', label: 'Componentes' },
  { id: 'gearing',    label: 'Desarrollos' },
  { id: 'specs',      label: 'Specs' },
];

export default function Bike() {
  const [tab, setTab] = useState('components');

  return (
    <>
      <h2>Mi bicicleta</h2>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'components' && <ComponentsList />}
      {tab === 'gearing'    && <GearTable />}
      {tab === 'specs'      && <BikeSpecForm />}
    </>
  );
}
