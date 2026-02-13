// Filtro por continente: fila horizontal de pills
import type { Continent } from '../../data/types';
import './ContinentFilter.css';

const CONTINENTS: { id: Continent; label: string; cssVar: string }[] = [
  { id: 'África', label: 'África', cssVar: '--color-africa' },
  { id: 'América', label: 'América', cssVar: '--color-america' },
  { id: 'Asia', label: 'Asia', cssVar: '--color-asia' },
  { id: 'Europa', label: 'Europa', cssVar: '--color-europe' },
  { id: 'Oceanía', label: 'Oceanía', cssVar: '--color-oceania' },
];

interface ContinentFilterProps {
  active: Continent | null;
  onChange: (continent: Continent | null) => void;
}

export function ContinentFilter({ active, onChange }: ContinentFilterProps) {
  return (
    <div className="continent-filter" role="radiogroup" aria-label="Filtrar por continente">
      <button
        className={`continent-filter__pill ${active === null ? 'continent-filter__pill--active' : ''}`}
        onClick={() => onChange(null)}
        aria-checked={active === null}
        role="radio"
      >
        Todos
      </button>
      {CONTINENTS.map(({ id, label, cssVar }) => (
        <button
          key={id}
          className={`continent-filter__pill ${active === id ? 'continent-filter__pill--active' : ''}`}
          onClick={() => onChange(id)}
          aria-checked={active === id}
          role="radio"
          style={{
            '--pill-color': `var(${cssVar})`,
          } as React.CSSProperties}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
