// Ficha de país — bottom sheet que muestra info detallada del país seleccionado
import { useState, useRef } from 'react';
import type { CountryData } from '../../data/types';
import type { CountryRankings } from '../../data/rankings';
import { useBottomSheetDrag } from '../../hooks/useBottomSheetDrag';
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

/** Máximo de idiomas visibles antes de truncar */
const MAX_LANGUAGES = 3;

type TooltipId = 'hdi' | 'ihdi' | null;

interface CountryCardProps {
  country: CountryData;
  rankings?: CountryRankings;
  onClose: () => void;
}

/** Formatea número con separador de miles */
function formatNumber(n: number): string {
  return n.toLocaleString('es-ES');
}

/** Formatea monedas: "Euro (€), Dólar (US$)" */
function formatCurrencies(currencies: CountryData['currencies']): string {
  if (currencies.length === 0) return '—';
  return currencies
    .map(c => c.symbol ? `${c.name} (${c.symbol})` : c.name)
    .join(', ');
}

/** Formatea idiomas con truncamiento */
function formatLanguages(languages: string[]): string {
  if (languages.length === 0) return '—';
  if (languages.length <= MAX_LANGUAGES) return languages.join(', ');
  return languages.slice(0, MAX_LANGUAGES).join(', ') + '…';
}

/** Icono (i) SVG inline para tooltips */
function InfoIcon() {
  return (
    <svg className="country-card__info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export function CountryCard({ country, rankings, onClose }: CountryCardProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const { dragHandlers } = useBottomSheetDrag({
    sheetRef,
    onClose,
    scrollRef: sheetRef,
  });

  const continentColor = CONTINENT_COLORS[country.continent] ?? 'var(--color-text-secondary)';
  const isAntarctica = country.cca2 === 'AQ';
  const [activeTooltip, setActiveTooltip] = useState<TooltipId>(null);

  // URL de Wikipedia derivada del slug
  const wikipediaUrl = country.wikipediaSlug
    ? (() => {
        const hasLangPrefix = country.wikipediaSlug.includes(':') && !country.wikipediaSlug.startsWith('http');
        const colonIdx = country.wikipediaSlug.indexOf(':');
        const lang = hasLangPrefix ? country.wikipediaSlug.slice(0, colonIdx) : 'es';
        const slug = hasLangPrefix ? country.wikipediaSlug.slice(colonIdx + 1) : country.wikipediaSlug;
        return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(slug)}`;
      })()
    : null;

  const toggleTooltip = (id: TooltipId) => {
    setActiveTooltip(prev => prev === id ? null : id);
  };

  return (
    <div
      ref={sheetRef}
      className="country-card"
      role="dialog"
      aria-label={`Ficha de ${country.name}`}
      {...dragHandlers}
    >
      <div className="bottom-sheet-handle" />
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
          <div className="country-card__field country-card__field--full">
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
            <span className="country-card__value">{formatCurrencies(country.currencies)}</span>
          </div>
          <div className="country-card__field">
            <span className="country-card__label">Gentilicio</span>
            <span className="country-card__value">
              {country.demonym
                ? country.demonym.charAt(0).toUpperCase() + country.demonym.slice(1)
                : '—'}
            </span>
          </div>
          <div className="country-card__field">
            <span className="country-card__label">Idiomas</span>
            <span className="country-card__value">{formatLanguages(country.languages)}</span>
          </div>
          {country.hdi !== null && (
            <>
              <div className="country-card__field country-card__field--tooltip-parent">
                <span className="country-card__label">
                  IDH
                  <button
                    className="country-card__info-btn"
                    onClick={() => toggleTooltip('hdi')}
                    aria-label="Información sobre IDH"
                  >
                    <InfoIcon />
                  </button>
                </span>
                <span className="country-card__value">
                  {country.hdi.toFixed(3)}
                  {rankings && rankings.hdiRank > 0 && (
                    <span className="country-card__rank"> #{rankings.hdiRank}</span>
                  )}
                </span>
                {activeTooltip === 'hdi' && (
                  <div className="country-card__tooltip">
                    Índice de Desarrollo Humano: mide salud, educación e ingresos. Rango 0–1.
                  </div>
                )}
              </div>
              <div className="country-card__field country-card__field--tooltip-parent">
                <span className="country-card__label">
                  IDH-D
                  <button
                    className="country-card__info-btn"
                    onClick={() => toggleTooltip('ihdi')}
                    aria-label="Información sobre IDH-D"
                  >
                    <InfoIcon />
                  </button>
                </span>
                <span className="country-card__value">
                  {country.ihdi !== null ? (
                    <>
                      {country.ihdi.toFixed(3)}
                      {rankings && rankings.ihdiRank > 0 && (
                        <span className="country-card__rank"> #{rankings.ihdiRank}</span>
                      )}
                    </>
                  ) : 'N/D'}
                </span>
                {activeTooltip === 'ihdi' && (
                  <div className="country-card__tooltip">
                    IDH ajustado por Desigualdad: penaliza la desigualdad en salud, educación e ingresos.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Botón Wikipedia */}
      {wikipediaUrl && (
        <button
          className="country-card__wikipedia"
          onClick={() => window.open(wikipediaUrl, '_blank')}
          aria-label={`Abrir ${country.name} en Wikipedia`}
        >
          <svg className="country-card__wikipedia-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Wikipedia
        </button>
      )}
    </div>
  );
}
