// Ficha de país — bottom sheet que muestra info detallada del país seleccionado
import type { CountryData } from '../../data/types';
import type { CountryRankings } from '../../data/rankings';
import './CountryCard.css';

/** Color CSS del continente */
const CONTINENT_COLORS: Record<string, string> = {
  'África': 'var(--color-africa)',
  'América': 'var(--color-america)',
  'Asia': 'var(--color-asia)',
  'Europa': 'var(--color-europe)',
  'Oceanía': 'var(--color-oceania)',
  'Antártida': 'var(--color-accent-amber)',
};

interface CountryCardProps {
  country: CountryData;
  rankings?: CountryRankings;
  onClose: () => void;
}

/** Formatea número con separador de miles */
function formatNumber(n: number): string {
  return n.toLocaleString('es-ES');
}

export function CountryCard({ country, rankings, onClose }: CountryCardProps) {
  const continentColor = CONTINENT_COLORS[country.continent] ?? 'var(--color-text-secondary)';
  const isAntarctica = country.cca2 === 'AQ';

  return (
    <div className="country-card" role="dialog" aria-label={`Ficha de ${country.name}`}>
      {/* Disclaimer contextual */}
      {isAntarctica ? (
        <div className="country-card__disclaimer">
          Territorio internacional — Tratado Antártico (1959)
        </div>
      ) : !country.unMember ? (
        <div className="country-card__disclaimer">
          Territorio no reconocido por la ONU
        </div>
      ) : null}

      {/* Cabecera: bandera + nombre + cerrar */}
      <div className="country-card__header">
        {country.flagSvg && (
          <img
            className="country-card__flag"
            src={country.flagSvg}
            alt={`Bandera de ${country.name}`}
            loading="eager"
          />
        )}
        <div className="country-card__title-group">
          <h2 className="country-card__name">{country.name}</h2>
          <span
            className="country-card__continent"
            style={{ color: continentColor }}
          >
            {country.continent}
          </span>
        </div>
        <button
          className="country-card__close"
          onClick={onClose}
          aria-label="Cerrar ficha"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Datos: layout especial para Antártida */}
      {isAntarctica ? (
        <div className="country-card__grid">
          <div className="country-card__field">
            <span className="country-card__label">Superficie</span>
            <span className="country-card__value">{formatNumber(country.area)} km²</span>
          </div>
          <div className="country-card__field country-card__field--full">
            <span className="country-card__value country-card__value--info">
              La Antártida no pertenece a ningún país. El Tratado Antártico, firmado en 1959, la
              reserva para la investigación científica y prohíbe la actividad militar y la
              explotación de sus recursos.
            </span>
          </div>
        </div>
      ) : (
        <div className="country-card__grid">
          <div className="country-card__field">
            <span className="country-card__label">Capital</span>
            <span className="country-card__value">{country.capital || '—'}</span>
          </div>
          <div className="country-card__field">
            <span className="country-card__label">Población</span>
            <span className="country-card__value">
              {formatNumber(country.population)} hab.
              {rankings && <span className="country-card__rank"> #{rankings.populationRank}</span>}
            </span>
          </div>
          <div className="country-card__field">
            <span className="country-card__label">Superficie</span>
            <span className="country-card__value">
              {formatNumber(country.area)} km²
              {rankings && <span className="country-card__rank"> #{rankings.areaRank}</span>}
            </span>
          </div>
          {country.area > 0 && (
            <div className="country-card__field">
              <span className="country-card__label">Densidad</span>
              <span className="country-card__value">
                {formatNumber(Math.round(country.population / country.area))} hab/km²
                {rankings && <span className="country-card__rank"> #{rankings.densityRank}</span>}
              </span>
            </div>
          )}
          <div className="country-card__field">
            <span className="country-card__label">Moneda</span>
            <span className="country-card__value">{country.currencies.join(', ') || '—'}</span>
          </div>
          <div className="country-card__field">
            <span className="country-card__label">Gentilicio</span>
            <span className="country-card__value">{country.demonym || '—'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
