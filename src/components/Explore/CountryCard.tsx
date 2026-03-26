// Ficha de país — bottom sheet que muestra info detallada del país seleccionado
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import type { CountryData, ContinentOrSpecial } from '../../data/types';
import type { CountryRankings } from '../../data/rankings';
import { CONTINENT_CSS_VAR_SPECIAL } from '../../data/continents';
import { useBottomSheetDrag } from '../../hooks/useBottomSheetDrag';
import './CountryCard.css';

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
  const { t } = useTranslation('explore');
  const sheetRef = useRef<HTMLDivElement>(null);
  const { dragHandlers } = useBottomSheetDrag({
    sheetRef,
    onClose,
  });

  const cssVar = CONTINENT_CSS_VAR_SPECIAL[country.continent as ContinentOrSpecial];
  const continentColor = cssVar ? `var(${cssVar})` : 'var(--color-text-secondary)';
  const isAntarctica = country.cca2 === 'AQ';
  const locale = useAppStore((s) => s.settings.locale);
  const [activeTooltip, setActiveTooltip] = useState<TooltipId>(null);

  // URL de Wikipedia derivada del slug
  // El slug puede tener prefijo de idioma (ej: "en:Spain") si el artículo no existe en el idioma activo
  const wikiLangBase = locale.startsWith('zh') ? 'zh' : locale === 'nb' ? 'no' : locale.split('-')[0];
  const wikipediaUrl = country.wikipediaSlug
    ? (() => {
        const hasLangPrefix = country.wikipediaSlug.includes(':') && !country.wikipediaSlug.startsWith('http');
        const colonIdx = country.wikipediaSlug.indexOf(':');
        const lang = hasLangPrefix ? country.wikipediaSlug.slice(0, colonIdx) : wikiLangBase;
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
      aria-label={t('card.aria.dialog', { country: country.name })}
    >
      {/* Drag zone: handle + disclaimer + header — touch-action: none para drag fiable */}
      <div className="country-card__drag-zone" {...dragHandlers}>
        <div className="bottom-sheet-handle" />
        {/* Disclaimer contextual */}
        {isAntarctica ? (
          <div className="country-card__disclaimer">
            {t('card.disclaimer.antarctica')}
          </div>
        ) : !country.unMember ? (
          <div className="country-card__disclaimer">
            {country.sovereignCountry
              ? t('card.disclaimer.territory', { sovereign: t(`card.sovereign.${country.sovereignCountry}`) })
              : t('card.disclaimer.disputed')}
          </div>
        ) : null}

        {/* Cabecera: bandera + nombre + wikipedia */}
        <div className="country-card__header">
          {country.flagSvg && (
            <img
              className="country-card__flag"
              src={country.flagSvg}
              alt={t('card.flagAlt', { country: country.name })}
              loading="eager"
            />
          )}
          <div className="country-card__title-group">
            <h2 className="country-card__name">{country.name}</h2>
            <span
              className="country-card__continent"
              style={{ color: continentColor }}
            >
              {t(`common:continent.${country.continent}`)}
            </span>
          </div>
          {wikipediaUrl && (
            <button
              className="country-card__wikipedia"
              onClick={() => window.open(wikipediaUrl, '_blank')}
              aria-label={t('card.aria.openWikipedia', { country: country.name })}
            >
              <img
                className="country-card__wikipedia-icon"
                src="https://www.wikipedia.org/static/apple-touch/wikipedia.png"
                alt="Wikipedia"
              />
            </button>
          )}
        </div>
      </div>

      {/* Body: contenido scrollable — touch-action: pan-y para scroll nativo */}
      <div className="country-card__body">
      {isAntarctica ? (
        <div className="country-card__grid">
          <div className="country-card__field">
            <span className="country-card__label">{t('card.field.area')}</span>
            <span className="country-card__value">{formatNumber(country.area)} km²</span>
          </div>
          <div className="country-card__field country-card__field--full">
            <span className="country-card__value country-card__value--info">
              {t('card.antarctica.info')}
            </span>
          </div>
        </div>
      ) : (
        <div className="country-card__grid">
          <div className="country-card__field country-card__field--full">
            <span className="country-card__label">{t('card.field.capital')}</span>
            <span className="country-card__value">{country.capital || '—'}</span>
          </div>
          <div className="country-card__field">
            <span className="country-card__label">{t('card.field.population')}</span>
            <span className="country-card__value">
              {formatNumber(country.population)} {t('card.unit.inhabitants')}
              {rankings && <span className="country-card__rank"> #{rankings.populationRank}</span>}
            </span>
          </div>
          <div className="country-card__field">
            <span className="country-card__label">{t('card.field.area')}</span>
            <span className="country-card__value">
              {formatNumber(country.area)} km²
              {rankings && <span className="country-card__rank"> #{rankings.areaRank}</span>}
            </span>
          </div>
          {country.area > 0 && (
            <div className="country-card__field">
              <span className="country-card__label">{t('card.field.density')}</span>
              <span className="country-card__value">
                {formatNumber(Math.round(country.population / country.area))} {t('card.unit.densityUnit')}
                {rankings && <span className="country-card__rank"> #{rankings.densityRank}</span>}
              </span>
            </div>
          )}
          <div className="country-card__field">
            <span className="country-card__label">{t('card.field.currency')}</span>
            <span className="country-card__value">{formatCurrencies(country.currencies)}</span>
          </div>
          <div className="country-card__field">
            <span className="country-card__label">{t('card.field.demonym')}</span>
            <span className="country-card__value">
              {country.demonym
                ? country.demonym.charAt(0).toUpperCase() + country.demonym.slice(1)
                : '—'}
            </span>
          </div>
          <div className="country-card__field">
            <span className="country-card__label">{t('card.field.languages')}</span>
            <span className="country-card__value">{formatLanguages(country.languages)}</span>
          </div>
          {country.hdi !== null && (
            <>
              <div className="country-card__field country-card__field--tooltip-parent">
                <span className="country-card__label">
                  {t('card.field.hdi')}
                  <button
                    className="country-card__info-btn"
                    onClick={() => toggleTooltip('hdi')}
                    aria-label={t('card.aria.hdiInfo')}
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
                    {t('card.tooltip.hdi')}
                  </div>
                )}
              </div>
              <div className="country-card__field country-card__field--tooltip-parent">
                <span className="country-card__label">
                  {t('card.field.ihdi')}
                  <button
                    className="country-card__info-btn"
                    onClick={() => toggleTooltip('ihdi')}
                    aria-label={t('card.aria.ihdiInfo')}
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
                  ) : t('card.na')}
                </span>
                {activeTooltip === 'ihdi' && (
                  <div className="country-card__tooltip">
                    {t('card.tooltip.ihdi')}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
      </div>

    </div>
  );
}
