// TableView — tabla país-capital-población a pantalla completa
// Soporta ordenamiento por columna y vista plana o agrupada por continente.
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CountryData, Continent, GameLevel } from '../../data/types';
import { LEVEL_EMOJI } from '../../data/levels';
import './TableView.css';

type SortKey = 'level' | 'name' | 'capital' | 'population';
type SortDir = 'asc' | 'desc';

/** Valor numérico de tier para sorting por nivel */
const LEVEL_TIER: Record<GameLevel, number> = { tourist: 1, backpacker: 2, guide: 3 };

interface TableViewProps {
  countries: Map<string, CountryData>;
  countryLevelMap: Map<string, GameLevel>;
  continentFilter: Continent | null;
  onCountryTap: (cca2: string) => void;
  onCapitalTap: (cca2: string) => void;
  initialSort?: { key: SortKey; dir: SortDir } | null;
  onSortChange?: (key: SortKey, dir: SortDir) => void;
  style?: React.CSSProperties;
}

/** Formato compacto de población: 1.4B, 45M, 800k */
function formatPopulation(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return n.toString();
}

/** Ordena una lista de países según key y dirección */
function sortCountries(
  list: CountryData[],
  key: SortKey,
  dir: SortDir,
  levelMap: Map<string, GameLevel>,
): CountryData[] {
  const sorted = [...list];
  sorted.sort((a, b) => {
    let cmp: number;
    if (key === 'level') {
      const tierA = levelMap.has(a.cca2) ? LEVEL_TIER[levelMap.get(a.cca2)!] : 4;
      const tierB = levelMap.has(b.cca2) ? LEVEL_TIER[levelMap.get(b.cca2)!] : 4;
      cmp = tierA - tierB;
      // Desempate por población descendente
      if (cmp === 0) cmp = b.population - a.population;
    } else if (key === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (key === 'capital') {
      cmp = a.capital.localeCompare(b.capital);
    } else {
      cmp = a.population - b.population;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

/** Indicador de dirección de ordenamiento */
function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return null;
  return <span className="table-view__sort-indicator">{dir === 'asc' ? ' ▲' : ' ▼'}</span>;
}

export function TableView({
  countries,
  countryLevelMap,
  continentFilter,
  onCountryTap,
  onCapitalTap,
  initialSort,
  onSortChange,
  style,
}: TableViewProps) {
  const { t } = useTranslation('explore');
  const [sortKey, setSortKey] = useState<SortKey>(initialSort?.key ?? 'population');
  const [sortDir, setSortDir] = useState<SortDir>(initialSort?.dir ?? 'desc');
  const [showNonUN, setShowNonUN] = useState(false);

  const toggleSort = (key: SortKey) => {
    let newDir: SortDir;
    if (sortKey === key) {
      newDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      newDir = (key === 'population') ? 'desc' : 'asc';
    }
    setSortKey(key);
    setSortDir(newDir);
    onSortChange?.(key, newDir);
  };

  // Lista plana filtrada y ordenada (para modo "Todos")
  const flatList = useMemo(() => {
    const list: CountryData[] = [];
    for (const country of countries.values()) {
      if (country.cca2 === 'AQ') continue;
      if (!showNonUN && !country.unMember) continue;
      if (continentFilter && country.continent !== continentFilter) continue;
      list.push(country);
    }
    return sortCountries(list, sortKey, sortDir, countryLevelMap);
  }, [countries, continentFilter, sortKey, sortDir, showNonUN, countryLevelMap]);

  // Lista agrupada por continente (para filtro de un continente)
  const groupedList = useMemo(() => {
    if (!continentFilter) return null;
    const list: CountryData[] = [];
    for (const country of countries.values()) {
      if (country.cca2 === 'AQ') continue;
      if (!showNonUN && !country.unMember) continue;
      if (country.continent !== continentFilter) continue;
      list.push(country);
    }
    return sortCountries(list, sortKey, sortDir, countryLevelMap);
  }, [countries, continentFilter, sortKey, sortDir, showNonUN, countryLevelMap]);

  const renderHeader = () => (
    <div className="table-view__table-header">
      <button className="table-view__header-btn table-view__header-btn--level" onClick={() => toggleSort('level')}>
        {'🏆'}<SortIndicator active={sortKey === 'level'} dir={sortDir} />
      </button>
      <button className="table-view__header-btn" onClick={() => toggleSort('name')}>
        {t('table.country')}<SortIndicator active={sortKey === 'name'} dir={sortDir} />
      </button>
      <button className="table-view__header-btn" onClick={() => toggleSort('capital')}>
        {t('table.capital')}<SortIndicator active={sortKey === 'capital'} dir={sortDir} />
      </button>
      <button className="table-view__header-btn table-view__header-btn--right" onClick={() => toggleSort('population')}>
        {t('table.population')}<SortIndicator active={sortKey === 'population'} dir={sortDir} />
      </button>
    </div>
  );

  const renderRow = (country: CountryData) => {
    const level = countryLevelMap.get(country.cca2);
    return (
      <div key={country.cca2} className="table-view__row">
        <span className="table-view__cell table-view__cell--level">
          {level ? LEVEL_EMOJI[level] : '—'}
        </span>
        <button
          className="table-view__cell table-view__cell--country"
          onClick={() => onCountryTap(country.cca2)}
        >
          {country.flagSvg && (
            <img
              className="table-view__flag"
              src={country.flagSvg}
              alt=""
              loading="lazy"
            />
          )}
          <span>{country.name}</span>
        </button>
        <button
          className="table-view__cell table-view__cell--capital"
          onClick={() => onCapitalTap(country.cca2)}
        >
          {country.capital}
        </button>
        <span className="table-view__cell table-view__cell--population">
          {formatPopulation(country.population)}
        </span>
      </div>
    );
  };

  return (
    <div className="table-view" style={style}>
      <div className="table-view__scroll">
        {/* Toggle de territorios no-ONU */}
        <div className="table-view__toggle-row">
          <span className="table-view__toggle-label">{t('table.nonUNToggle')}</span>
          <button
            className={`table-view__toggle ${showNonUN ? 'table-view__toggle--active' : ''}`}
            role="switch"
            aria-checked={showNonUN}
            onClick={() => setShowNonUN(v => !v)}
          >
            <span className="table-view__toggle-thumb" />
          </button>
        </div>
        {continentFilter === null ? (
          // Tabla única sin agrupación cuando filtro es "Todos"
          <div className="table-view__table">
            {renderHeader()}
            {flatList.map(renderRow)}
          </div>
        ) : (
          // Tabla con header de continente cuando hay filtro
          <section className="table-view__section">
            <h3 className="table-view__continent-header">{t(`common:continent.${continentFilter}`)}</h3>
            <div className="table-view__table">
              {renderHeader()}
              {(groupedList ?? []).map(renderRow)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
