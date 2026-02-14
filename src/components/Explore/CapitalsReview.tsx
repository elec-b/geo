// CapitalsReview — tabla país-capital-población a pantalla completa
// Soporta ordenamiento por columna y vista plana o agrupada por continente.
import { useState, useMemo } from 'react';
import type { CountryData, Continent } from '../../data/types';
import './CapitalsReview.css';

type SortKey = 'name' | 'capital' | 'population';
type SortDir = 'asc' | 'desc';

interface CapitalsReviewProps {
  countries: Map<string, CountryData>;
  continentFilter: Continent | null;
  onCountryTap: (cca2: string) => void;
  onCapitalTap: (cca2: string) => void;
}

/** Formato compacto de población: 1.4B, 45M, 800k */
function formatPopulation(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return n.toString();
}

/** Ordena una lista de países según key y dirección */
function sortCountries(list: CountryData[], key: SortKey, dir: SortDir): CountryData[] {
  const sorted = [...list];
  sorted.sort((a, b) => {
    let cmp: number;
    if (key === 'name') cmp = a.name.localeCompare(b.name);
    else if (key === 'capital') cmp = a.capital.localeCompare(b.capital);
    else cmp = a.population - b.population;
    return dir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

/** Indicador de dirección de ordenamiento */
function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return null;
  return <span className="capitals-review__sort-indicator">{dir === 'asc' ? ' ▲' : ' ▼'}</span>;
}

export function CapitalsReview({
  countries,
  continentFilter,
  onCountryTap,
  onCapitalTap,
}: CapitalsReviewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'population' ? 'desc' : 'asc');
    }
  };

  // Lista plana filtrada y ordenada (para modo "Todos")
  const flatList = useMemo(() => {
    const list: CountryData[] = [];
    for (const country of countries.values()) {
      if (continentFilter && country.continent !== continentFilter) continue;
      list.push(country);
    }
    return sortCountries(list, sortKey, sortDir);
  }, [countries, continentFilter, sortKey, sortDir]);

  // Lista agrupada por continente (para filtro de un continente)
  const groupedList = useMemo(() => {
    if (!continentFilter) return null;
    const list: CountryData[] = [];
    for (const country of countries.values()) {
      if (country.continent !== continentFilter) continue;
      list.push(country);
    }
    return sortCountries(list, sortKey, sortDir);
  }, [countries, continentFilter, sortKey, sortDir]);

  const renderHeader = () => (
    <div className="capitals-review__table-header">
      <button className="capitals-review__header-btn" onClick={() => toggleSort('name')}>
        País<SortIndicator active={sortKey === 'name'} dir={sortDir} />
      </button>
      <button className="capitals-review__header-btn" onClick={() => toggleSort('capital')}>
        Capital<SortIndicator active={sortKey === 'capital'} dir={sortDir} />
      </button>
      <button className="capitals-review__header-btn capitals-review__header-btn--right" onClick={() => toggleSort('population')}>
        Pob.<SortIndicator active={sortKey === 'population'} dir={sortDir} />
      </button>
    </div>
  );

  const renderRow = (country: CountryData) => (
    <div key={country.cca2} className="capitals-review__row">
      <button
        className="capitals-review__cell capitals-review__cell--country"
        onClick={() => onCountryTap(country.cca2)}
      >
        <img
          className="capitals-review__flag"
          src={country.flagSvg}
          alt=""
          loading="lazy"
        />
        <span>{country.name}</span>
      </button>
      <button
        className="capitals-review__cell capitals-review__cell--capital"
        onClick={() => onCapitalTap(country.cca2)}
      >
        {country.capital}
      </button>
      <span className="capitals-review__cell capitals-review__cell--population">
        {formatPopulation(country.population)}
      </span>
    </div>
  );

  return (
    <div className="capitals-review">
      <div className="capitals-review__scroll">
        {continentFilter === null ? (
          // Tabla única sin agrupación cuando filtro es "Todos"
          <div className="capitals-review__table">
            {renderHeader()}
            {flatList.map(renderRow)}
          </div>
        ) : (
          // Tabla con header de continente cuando hay filtro
          <section className="capitals-review__section">
            <h3 className="capitals-review__continent-header">{continentFilter}</h3>
            <div className="capitals-review__table">
              {renderHeader()}
              {(groupedList ?? []).map(renderRow)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
