// Filtro por continente: fila horizontal de pills
import { useTranslation } from 'react-i18next';
import type { Continent } from '../../data/types';
import { CONTINENTS, CONTINENT_CSS_VAR } from '../../data/continents';
import './ContinentFilter.css';

interface ContinentFilterProps {
  active: Continent | null;
  onChange: (continent: Continent | null) => void;
}

export function ContinentFilter({ active, onChange }: ContinentFilterProps) {
  const { t } = useTranslation('common');

  return (
    <div className="continent-filter" role="radiogroup" aria-label="Filtrar por continente">
      <button
        className={`continent-filter__pill ${active === null ? 'continent-filter__pill--active' : ''}`}
        onClick={() => onChange(null)}
        aria-checked={active === null}
        role="radio"
      >
        {t('continentFilter.all')}
      </button>
      {CONTINENTS.map((c) => (
        <button
          key={c}
          className={`continent-filter__pill ${active === c ? 'continent-filter__pill--active' : ''}`}
          onClick={() => onChange(c)}
          aria-checked={active === c}
          role="radio"
          style={{
            '--pill-color': `var(${CONTINENT_CSS_VAR[c]})`,
          } as React.CSSProperties}
        >
          {t(`continent.${c}`)}
        </button>
      ))}
    </div>
  );
}
