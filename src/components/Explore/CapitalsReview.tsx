// CapitalsReview — tabla país-capital a pantalla completa
import { useMemo } from 'react';
import type { CountryData, Continent } from '../../data/types';
import './CapitalsReview.css';

const CONTINENT_ORDER: Continent[] = ['África', 'América', 'Asia', 'Europa', 'Oceanía'];

interface CapitalsReviewProps {
  countries: Map<string, CountryData>;
  continentFilter: Continent | null;
  onCountryTap: (cca2: string) => void;
  onCapitalTap: (cca2: string) => void;
}

/** Agrupa países por continente, ordenados alfabéticamente dentro de cada grupo */
function groupByContinent(
  countries: Map<string, CountryData>,
  filter: Continent | null,
): Map<Continent, CountryData[]> {
  const groups = new Map<Continent, CountryData[]>();

  for (const continent of CONTINENT_ORDER) {
    if (filter && filter !== continent) continue;
    groups.set(continent, []);
  }

  for (const country of countries.values()) {
    if (filter && country.continent !== filter) continue;
    const list = groups.get(country.continent);
    if (list) list.push(country);
  }

  // Ordenar cada grupo alfabéticamente por nombre
  for (const list of groups.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  return groups;
}

export function CapitalsReview({
  countries,
  continentFilter,
  onCountryTap,
  onCapitalTap,
}: CapitalsReviewProps) {
  const groups = useMemo(
    () => groupByContinent(countries, continentFilter),
    [countries, continentFilter],
  );

  return (
    <div className="capitals-review">
      <div className="capitals-review__scroll">
        {Array.from(groups).map(([continent, list]) => (
          <section key={continent} className="capitals-review__section">
            <h3 className="capitals-review__continent-header">{continent}</h3>
            <div className="capitals-review__table">
              <div className="capitals-review__table-header">
                <span>País</span>
                <span>Capital</span>
              </div>
              {list.map(country => (
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
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
