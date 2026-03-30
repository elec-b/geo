# Spike: Auditoría de datos de ficha de país (población, superficie, IDH, IDH-D)

**Fecha**: 2026-03-30
**Contexto**: Verificar que los datos numéricos de la ficha de país (población, superficie, IDH, IDH-D) están actualizados. Los datos textuales (nombres, capitales, monedas, idiomas, gentilicios) ya se verificaron en spikes anteriores.
**Método**: Agent team (auditor + refutador). Auditor comparó los 195 países contra fuentes actuales. Refutador desafió metodología, detectó errores de origen y verificó muestras.
**Fuentes**: REST Countries v3.1, UNDP HDR 2025 (publicado mayo 2025, datos año 2023), UNDP HDR 2023/2024 (datos año 2022), Wikipedia, World Population Review, UN Population Division.

---

## 1. Población y superficie

### Resultado: sin discrepancias vs fuente actual, pero fuente archivada

Los datos en `countries-base.json` son **idénticos** a los que devuelve REST Countries v3.1. Sin embargo:

- **REST Countries fue archivado en junio 2024** — la API sigue online pero los datos no se actualizan.
- Para países de rápido crecimiento, los datos ya están desfasados:

| País | cca2 | App (REST Countries) | Estimación UN 2025 | Error |
|------|------|---------------------|-------------------|-------|
| India | IN | 1,417,173,173 | ~1,464,000,000 | ~3.3% |
| Nigeria | NG | 223,804,632 | ~237,500,000 | ~6.1% |

- **Superficie**: sin cambios esperables (las superficies terrestres no cambian).
- **Densidad**: campo calculado (`population / area`), no requiere auditoría propia. Confirmado en `CountryCard.tsx:180`.

### Valoración

Para una app educativa, un error <7% en población es tolerable a corto plazo. No es urgente cambiar la fuente, pero debería planificarse como parte de la tarea de "actualización silenciosa vía CDN".

**Alternativas futuras**: World Bank API (más autoritativa, actualización anual) o UN Population Division (`population.un.org`).

### Acción requerida ahora: ninguna

La actualización de fuente de población se abordará en la tarea de CDN.

---

## 2. IDH (HDI)

### Contexto

- Datos actuales en `scripts/data/hdi.json`: **HDR 2023/2024** (año referencia 2022).
- Informe más reciente: **HDR 2025**, publicado 6 mayo 2025, datos año 2023.
- UNDP recalcula retroactivamente TODOS los años en cada nueva edición → los valores no son comparables entre ediciones.
- **Hallazgo crítico del refutador**: 47 países ya tenían errores en `hdi.json` incluso contra el HDR 2023/2024 del que supuestamente se extrajeron. Los "cambios grandes" del auditor mezclan: (a) progreso real 2022→2023, (b) revisiones metodológicas de UNDP, y (c) errores preexistentes en nuestro archivo.

### Acción requerida: regenerar `hdi.json` completo desde HDR 2025

Los 194 países en `hdi.json` deben actualizarse al HDR 2025. Solo 2 no cambian. A continuación, la tabla completa con valores exactos (actual → nuevo).

#### Cambios HDI >= 0.020

| cca2 | Actual (app) | Nuevo (HDR 2025) | Diff |
|------|-------------|-----------------|------|
| SB | 0.702 | 0.584 | -0.118 |
| SZ | 0.597 | 0.695 | +0.098 |
| LR | 0.421 | 0.510 | +0.089 |
| BT | 0.781 | 0.698 | -0.083 |
| CG | 0.571 | 0.649 | +0.078 |
| VC | 0.733 | 0.798 | +0.065 |
| SC | 0.785 | 0.848 | +0.063 |
| KN | 0.777 | 0.840 | +0.063 |
| SM | 0.853 | 0.915 | +0.062 |
| NA | 0.615 | 0.665 | +0.050 |
| TV | 0.641 | 0.689 | +0.048 |
| ZW | 0.550 | 0.598 | +0.048 |
| YE | 0.424 | 0.470 | +0.046 |
| BG | 0.799 | 0.845 | +0.046 |
| MK | 0.770 | 0.815 | +0.045 |
| CD | 0.479 | 0.522 | +0.043 |
| OM | 0.816 | 0.858 | +0.042 |
| PS | 0.716 | 0.674 | -0.042 |
| DM | 0.720 | 0.761 | +0.041 |
| IN | 0.644 | 0.685 | +0.041 |
| VN | 0.726 | 0.766 | +0.040 |
| NI | 0.667 | 0.706 | +0.039 |
| PY | 0.717 | 0.756 | +0.039 |
| AG | 0.814 | 0.851 | +0.037 |
| NR | 0.740 | 0.703 | -0.037 |
| LS | 0.514 | 0.550 | +0.036 |
| BO | 0.698 | 0.733 | +0.035 |
| GN | 0.465 | 0.500 | +0.035 |
| KZ | 0.802 | 0.837 | +0.035 |
| AF | 0.462 | 0.496 | +0.034 |
| GY | 0.742 | 0.776 | +0.034 |
| GT | 0.629 | 0.662 | +0.033 |
| CI | 0.550 | 0.582 | +0.032 |
| MZ | 0.461 | 0.493 | +0.032 |
| PE | 0.762 | 0.794 | +0.032 |
| UG | 0.550 | 0.582 | +0.032 |
| UY | 0.830 | 0.862 | +0.032 |
| GW | 0.483 | 0.514 | +0.031 |
| AO | 0.586 | 0.616 | +0.030 |
| CO | 0.758 | 0.788 | +0.030 |
| GE | 0.814 | 0.844 | +0.030 |
| RW | 0.548 | 0.578 | +0.030 |
| ZM | 0.565 | 0.595 | +0.030 |
| AD | 0.884 | 0.913 | +0.029 |
| AZ | 0.760 | 0.789 | +0.029 |
| LB | 0.723 | 0.752 | +0.029 |
| PW | 0.814 | 0.786 | -0.028 |
| RS | 0.805 | 0.833 | +0.028 |
| CF | 0.387 | 0.414 | +0.027 |
| CR | 0.806 | 0.833 | +0.027 |
| GA | 0.706 | 0.733 | +0.027 |
| KE | 0.601 | 0.628 | +0.027 |
| SR | 0.695 | 0.722 | +0.027 |
| TL | 0.607 | 0.634 | +0.027 |
| BR | 0.760 | 0.786 | +0.026 |
| GH | 0.602 | 0.628 | +0.026 |
| GQ | 0.648 | 0.674 | +0.026 |
| AM | 0.786 | 0.811 | +0.025 |
| BA | 0.779 | 0.804 | +0.025 |
| NE | 0.394 | 0.419 | +0.025 |
| PL | 0.881 | 0.906 | +0.025 |
| SA | 0.875 | 0.900 | +0.025 |
| SK | 0.855 | 0.880 | +0.025 |
| GM | 0.500 | 0.524 | +0.024 |
| MM | 0.585 | 0.609 | +0.024 |
| SO | 0.380 | 0.404 | +0.024 |
| ST | 0.613 | 0.637 | +0.024 |
| TG | 0.547 | 0.571 | +0.024 |
| TO | 0.745 | 0.769 | +0.024 |
| ZA | 0.717 | 0.741 | +0.024 |
| AR | 0.842 | 0.865 | +0.023 |
| BW | 0.708 | 0.731 | +0.023 |
| BY | 0.801 | 0.824 | +0.023 |
| EG | 0.731 | 0.754 | +0.023 |
| LC | 0.725 | 0.748 | +0.023 |
| LV | 0.866 | 0.889 | +0.023 |
| MR | 0.540 | 0.563 | +0.023 |
| TZ | 0.532 | 0.555 | +0.023 |
| MD | 0.763 | 0.785 | +0.022 |
| TD | 0.394 | 0.416 | +0.022 |
| AL | 0.789 | 0.810 | +0.021 |
| BZ | 0.700 | 0.721 | +0.021 |
| HN | 0.624 | 0.645 | +0.021 |
| KI | 0.623 | 0.644 | +0.021 |
| NP | 0.601 | 0.622 | +0.021 |

#### Cambios HDI < 0.020

| cca2 | Actual (app) | Nuevo (HDR 2025) | Diff |
|------|-------------|-----------------|------|
| HT | 0.535 | 0.554 | +0.019 |
| HU | 0.851 | 0.870 | +0.019 |
| IR | 0.780 | 0.799 | +0.019 |
| KG | 0.701 | 0.720 | +0.019 |
| PA | 0.820 | 0.839 | +0.019 |
| TM | 0.745 | 0.764 | +0.019 |
| CL | 0.860 | 0.878 | +0.018 |
| DZ | 0.745 | 0.763 | +0.018 |
| JO | 0.736 | 0.754 | +0.018 |
| ME | 0.844 | 0.862 | +0.018 |
| PG | 0.558 | 0.576 | +0.018 |
| RO | 0.827 | 0.845 | +0.018 |
| VU | 0.604 | 0.621 | +0.017 |
| LT | 0.879 | 0.895 | +0.016 |
| PT | 0.874 | 0.890 | +0.016 |
| BD | 0.670 | 0.685 | +0.015 |
| CZ | 0.900 | 0.915 | +0.015 |
| GR | 0.893 | 0.908 | +0.015 |
| ID | 0.713 | 0.728 | +0.015 |
| TR | 0.838 | 0.853 | +0.015 |
| TN | 0.732 | 0.746 | +0.014 |
| BI | 0.426 | 0.439 | +0.013 |
| FM | 0.628 | 0.615 | -0.013 |
| IS | 0.959 | 0.972 | +0.013 |
| SN | 0.517 | 0.530 | +0.013 |
| SY | 0.577 | 0.564 | -0.013 |
| UZ | 0.727 | 0.740 | +0.013 |
| AU | 0.946 | 0.958 | +0.012 |
| EC | 0.765 | 0.777 | +0.012 |
| MA | 0.698 | 0.710 | +0.012 |
| MY | 0.807 | 0.819 | +0.012 |
| NG | 0.548 | 0.560 | +0.012 |
| TJ | 0.679 | 0.691 | +0.012 |
| BH | 0.888 | 0.899 | +0.011 |
| BJ | 0.504 | 0.515 | +0.011 |
| ER | 0.492 | 0.503 | +0.011 |
| HR | 0.878 | 0.889 | +0.011 |
| JM | 0.709 | 0.720 | +0.011 |
| QA | 0.875 | 0.886 | +0.011 |
| US | 0.927 | 0.938 | +0.011 |
| BF | 0.449 | 0.459 | +0.010 |
| DK | 0.952 | 0.962 | +0.010 |
| DO | 0.766 | 0.776 | +0.010 |
| FR | 0.910 | 0.920 | +0.010 |
| MU | 0.796 | 0.806 | +0.010 |
| PH | 0.710 | 0.720 | +0.010 |
| RU | 0.822 | 0.832 | +0.010 |
| SL | 0.477 | 0.467 | -0.010 |
| VE | 0.699 | 0.709 | +0.010 |
| BE | 0.942 | 0.951 | +0.009 |
| CN | 0.788 | 0.797 | +0.009 |
| DE | 0.950 | 0.959 | +0.009 |
| IQ | 0.686 | 0.695 | +0.009 |
| ML | 0.410 | 0.419 | +0.009 |
| MT | 0.915 | 0.924 | +0.009 |
| MW | 0.508 | 0.517 | +0.009 |
| NL | 0.946 | 0.955 | +0.009 |
| BN | 0.829 | 0.837 | +0.008 |
| BS | 0.812 | 0.820 | +0.008 |
| IT | 0.907 | 0.915 | +0.008 |
| KR | 0.929 | 0.937 | +0.008 |
| MX | 0.781 | 0.789 | +0.008 |
| ES | 0.911 | 0.918 | +0.007 |
| KM | 0.596 | 0.603 | +0.007 |
| SE | 0.952 | 0.959 | +0.007 |
| TT | 0.814 | 0.807 | -0.007 |
| CV | 0.662 | 0.668 | +0.006 |
| CY | 0.907 | 0.913 | +0.006 |
| EE | 0.899 | 0.905 | +0.006 |
| FI | 0.942 | 0.948 | +0.006 |
| GB | 0.940 | 0.946 | +0.006 |
| KH | 0.600 | 0.606 | +0.006 |
| MN | 0.741 | 0.747 | +0.006 |
| UA | 0.773 | 0.779 | +0.006 |
| ET | 0.492 | 0.497 | +0.005 |
| JP | 0.920 | 0.925 | +0.005 |
| KW | 0.847 | 0.852 | +0.005 |
| LU | 0.927 | 0.922 | -0.005 |
| SI | 0.926 | 0.931 | +0.005 |
| TH | 0.803 | 0.798 | -0.005 |
| AT | 0.926 | 0.930 | +0.004 |
| CA | 0.935 | 0.939 | +0.004 |
| DJ | 0.509 | 0.513 | +0.004 |
| GD | 0.795 | 0.791 | -0.004 |
| IL | 0.915 | 0.919 | +0.004 |
| LK | 0.780 | 0.776 | -0.004 |
| MV | 0.762 | 0.766 | +0.004 |
| NO | 0.966 | 0.970 | +0.004 |
| SV | 0.674 | 0.678 | +0.004 |
| AE | 0.937 | 0.940 | +0.003 |
| CH | 0.967 | 0.970 | +0.003 |
| LA | 0.620 | 0.617 | -0.003 |
| LI | 0.935 | 0.938 | +0.003 |
| LY | 0.718 | 0.721 | +0.003 |
| SG | 0.949 | 0.946 | -0.003 |
| SS | 0.385 | 0.388 | +0.003 |
| BB | 0.809 | 0.811 | +0.002 |
| CU | 0.764 | 0.762 | -0.002 |
| FJ | 0.729 | 0.731 | +0.002 |
| CM | 0.587 | 0.588 | +0.001 |
| IE | 0.950 | 0.949 | -0.001 |
| NZ | 0.939 | 0.938 | -0.001 |
| SD | 0.510 | 0.511 | +0.001 |
| WS | 0.707 | 0.708 | +0.001 |

#### Países sin HDI en HDR 2025

| cca2 | Valor actual en app | Decisión | Nota |
|------|--------------------|---------|----|
| KP | 0.733 | Mantener | No aparece en HDR 2023/2024 ni 2025. Fuente original no documentada |
| TW | 0.926 | Mantener | No miembro ONU, excluido de UNDP. Fuente suplementaria |
| XK | 0.750 | Mantener | Soberanía en disputa, excluido de UNDP. Fuente suplementaria |

---

## 3. IDH-D (IHDI)

### 3a. Países que ganan IHDI (antes null, ahora con valor) — 25 países

| cca2 | Actual (app) | Nuevo (HDR 2025) |
|------|-------------|-----------------|
| AD | null | 0.837 |
| BB | null | 0.620 |
| BN | null | 0.756 |
| BS | null | 0.670 |
| CV | null | 0.478 |
| DJ | null | 0.341 |
| FJ | null | 0.626 |
| JM | null | 0.590 |
| KI | null | 0.535 |
| KM | null | 0.356 |
| LC | null | 0.523 |
| MV | null | 0.602 |
| NR | null | 0.599 |
| OM | null | 0.750 |
| PW | null | 0.616 |
| SB | null | 0.483 |
| SC | null | 0.755 |
| SG | null | 0.823 |
| SO | null | 0.229 |
| ST | null | 0.477 |
| TO | null | 0.682 |
| TV | null | 0.578 |
| VE | null | 0.605 |
| VU | null | 0.521 |
| WS | null | 0.609 |

### 3b. Países que pierden IHDI (tenían valor, ya no disponible) — 3 países

| cca2 | Actual (app) | Nuevo (HDR 2025) |
|------|-------------|-----------------|
| LB | 0.575 | null |
| SA | 0.759 | null |
| UZ | 0.620 | null |

### 3c. Países con IHDI que cambia de valor — cambios >= 0.020

| cca2 | Actual (app) | Nuevo (HDR 2025) | Diff |
|------|-------------|-----------------|------|
| BT | 0.637 | 0.478 | -0.159 |
| AZ | 0.668 | 0.735 | +0.067 |
| BO | 0.512 | 0.578 | +0.066 |
| EG | 0.518 | 0.582 | +0.064 |
| RS | 0.710 | 0.772 | +0.062 |
| PY | 0.537 | 0.599 | +0.062 |
| VN | 0.580 | 0.641 | +0.061 |
| KZ | 0.706 | 0.766 | +0.060 |
| PH | 0.537 | 0.597 | +0.060 |
| KG | 0.592 | 0.649 | +0.057 |
| IR | 0.589 | 0.643 | +0.054 |
| LR | 0.272 | 0.326 | +0.054 |
| BW | 0.456 | 0.509 | +0.053 |
| HN | 0.443 | 0.496 | +0.053 |
| MM | 0.424 | 0.477 | +0.053 |
| PE | 0.580 | 0.633 | +0.053 |
| PG | 0.370 | 0.423 | +0.053 |
| SV | 0.502 | 0.555 | +0.053 |
| AM | 0.691 | 0.743 | +0.052 |
| NI | 0.483 | 0.535 | +0.052 |
| DO | 0.583 | 0.634 | +0.051 |
| EC | 0.589 | 0.640 | +0.051 |
| MD | 0.668 | 0.719 | +0.051 |
| MX | 0.595 | 0.646 | +0.051 |
| YE | 0.274 | 0.325 | +0.051 |
| NA | 0.389 | 0.438 | +0.049 |
| UY | 0.699 | 0.747 | +0.048 |
| AR | 0.714 | 0.761 | +0.047 |
| NG | 0.333 | 0.379 | +0.046 |
| PS | 0.584 | 0.538 | -0.046 |
| CG | 0.381 | 0.426 | +0.045 |
| ID | 0.563 | 0.608 | +0.045 |
| BY | 0.729 | 0.773 | +0.044 |
| GE | 0.710 | 0.754 | +0.044 |
| AE | 0.824 | 0.866 | +0.042 |
| GA | 0.517 | 0.558 | +0.041 |
| PA | 0.623 | 0.664 | +0.041 |
| SZ | 0.390 | 0.431 | +0.041 |
| GT | 0.440 | 0.479 | +0.039 |
| BG | 0.710 | 0.748 | +0.038 |
| MK | 0.685 | 0.723 | +0.038 |
| GR | 0.791 | 0.825 | +0.034 |
| GW | 0.297 | 0.331 | +0.034 |
| CN | 0.637 | 0.671 | +0.034 |
| SK | 0.799 | 0.833 | +0.034 |
| TJ | 0.560 | 0.594 | +0.034 |
| IQ | 0.502 | 0.534 | +0.032 |
| RO | 0.726 | 0.758 | +0.032 |
| ES | 0.788 | 0.819 | +0.031 |
| HU | 0.789 | 0.820 | +0.031 |
| LK | 0.661 | 0.630 | -0.031 |
| TL | 0.420 | 0.451 | +0.031 |
| CD | 0.311 | 0.341 | +0.030 |
| KE | 0.426 | 0.456 | +0.030 |
| TN | 0.565 | 0.595 | +0.030 |
| SS | 0.198 | 0.226 | +0.028 |
| TH | 0.649 | 0.677 | +0.028 |
| IT | 0.790 | 0.817 | +0.027 |
| LS | 0.330 | 0.357 | +0.027 |
| CY | 0.815 | 0.841 | +0.026 |
| ZW | 0.380 | 0.406 | +0.026 |
| MA | 0.492 | 0.517 | +0.025 |
| MN | 0.622 | 0.647 | +0.025 |
| SE | 0.911 | 0.886 | -0.025 |
| CR | 0.654 | 0.678 | +0.024 |
| BF | 0.296 | 0.273 | -0.023 |
| UG | 0.377 | 0.400 | +0.023 |
| CO | 0.571 | 0.593 | +0.022 |
| MY | 0.686 | 0.707 | +0.021 |
| ET | 0.347 | 0.326 | -0.021 |
| UA | 0.694 | 0.715 | +0.021 |
| JO | 0.617 | 0.637 | +0.020 |
| ML | 0.261 | 0.281 | +0.020 |
| CM | 0.381 | 0.361 | -0.020 |

### 3d. Países con IHDI que cambia de valor — cambios < 0.020

| cca2 | Actual (app) | Nuevo (HDR 2025) | Diff |
|------|-------------|-----------------|------|
| BA | 0.670 | 0.689 | +0.019 |
| CZ | 0.847 | 0.866 | +0.019 |
| GH | 0.418 | 0.399 | -0.019 |
| HR | 0.809 | 0.828 | +0.019 |
| SL | 0.300 | 0.281 | -0.019 |
| BR | 0.576 | 0.594 | +0.018 |
| RU | 0.743 | 0.761 | +0.018 |
| AO | 0.377 | 0.360 | -0.017 |
| CF | 0.236 | 0.253 | +0.017 |
| DZ | 0.584 | 0.601 | +0.017 |
| MT | 0.826 | 0.843 | +0.017 |
| MW | 0.348 | 0.365 | +0.017 |
| FR | 0.820 | 0.836 | +0.016 |
| PT | 0.779 | 0.795 | +0.016 |
| AF | 0.306 | 0.321 | +0.015 |
| CI | 0.365 | 0.350 | -0.015 |
| IN | 0.460 | 0.475 | +0.015 |
| KR | 0.872 | 0.857 | -0.015 |
| ZA | 0.461 | 0.476 | +0.015 |
| BD | 0.496 | 0.482 | -0.014 |
| CL | 0.709 | 0.723 | +0.014 |
| HT | 0.323 | 0.337 | +0.014 |
| NL | 0.878 | 0.892 | +0.014 |
| RW | 0.385 | 0.399 | +0.014 |
| TD | 0.238 | 0.252 | +0.014 |
| BE | 0.878 | 0.891 | +0.013 |
| LV | 0.800 | 0.813 | +0.013 |
| LU | 0.850 | 0.838 | -0.012 |
| ME | 0.759 | 0.771 | +0.012 |
| BJ | 0.327 | 0.316 | -0.011 |
| AT | 0.851 | 0.861 | +0.010 |
| BI | 0.296 | 0.286 | -0.010 |
| TR | 0.698 | 0.708 | +0.010 |
| MR | 0.365 | 0.374 | +0.009 |
| SI | 0.876 | 0.885 | +0.009 |
| ZM | 0.370 | 0.361 | -0.009 |
| EE | 0.848 | 0.840 | -0.008 |
| IS | 0.915 | 0.923 | +0.008 |
| TZ | 0.383 | 0.391 | +0.008 |
| CA | 0.860 | 0.867 | +0.007 |
| DE | 0.883 | 0.890 | +0.007 |
| NP | 0.430 | 0.437 | +0.007 |
| NZ | 0.860 | 0.853 | -0.007 |
| GN | 0.296 | 0.302 | +0.006 |
| PK | 0.370 | 0.364 | -0.006 |
| IL | 0.809 | 0.813 | +0.004 |
| JP | 0.850 | 0.845 | -0.005 |
| KH | 0.440 | 0.444 | +0.004 |
| MZ | 0.293 | 0.297 | +0.004 |
| SD | 0.332 | 0.328 | -0.004 |
| SN | 0.345 | 0.340 | -0.005 |
| TG | 0.367 | 0.363 | -0.004 |
| US | 0.837 | 0.832 | -0.005 |
| AU | 0.876 | 0.873 | -0.003 |
| GM | 0.332 | 0.329 | -0.003 |
| IE | 0.886 | 0.883 | -0.003 |
| PL | 0.821 | 0.818 | -0.003 |
| NE | 0.262 | 0.265 | +0.003 |
| FI | 0.890 | 0.888 | -0.002 |
| GB | 0.867 | 0.869 | +0.002 |
| AL | 0.706 | 0.705 | -0.001 |
| DK | 0.910 | 0.909 | -0.001 |
| LA | 0.461 | 0.462 | +0.001 |
| MU | 0.670 | 0.669 | -0.001 |
| NO | 0.908 | 0.909 | +0.001 |

---

## 4. Errores preexistentes en hdi.json

El refutador descubrió que `hdi.json` ya tenía errores contra el HDR 2023/2024 del que supuestamente se extrajeron los datos. Los más graves:

| cca2 | En app | HDR 2023/2024 real | Error |
|------|--------|-------------------|-------|
| SB | 0.702 | 0.562 | +0.140 |
| BT | 0.781 | 0.681 | +0.100 |
| LR | 0.421 | 0.487 | -0.066 |
| NR | 0.740 | 0.696 | +0.044 |
| TL | 0.607 | 0.566 | +0.041 |
| UA | 0.773 | 0.734 | +0.039 |
| LY | 0.718 | 0.746 | -0.028 |
| TR | 0.838 | 0.855 | -0.017 |
| SZ | 0.597 | 0.610 | -0.013 |

Estos errores quedan corregidos al actualizar a HDR 2025. No se requiere acción adicional, pero subrayan la necesidad de un script de generación automatizado desde la fuente oficial.

---

## 5. Resumen de acciones

| Dato | Estado | Acción |
|------|--------|--------|
| **Población** | Correcto vs REST Countries, pero fuente archivada (junio 2024). Desfase <7% en países grandes | Ninguna ahora. Migrar fuente en tarea de CDN |
| **Superficie** | Correcto. No cambia | Ninguna |
| **HDI** | 192 de 194 países desactualizados + errores de origen | Regenerar `hdi.json` completo desde HDR 2025 |
| **IHDI** | 168 cambios (143 actualizaciones + 25 nuevos + 3 eliminados) | Incluido en la regeneración de `hdi.json` |
| **KP/TW/XK** | Sin HDI en UNDP. Valores actuales de fuente no documentada | Mantener. Documentar fuente |

### Recomendaciones de proceso

1. **Crear script de generación** de `hdi.json` desde el Excel oficial de UNDP, para evitar errores manuales.
2. **Añadir año de referencia** al archivo (`"_meta": { "source": "HDR 2025", "dataYear": 2023 }`).
3. **Fuente de población**: planificar migración de REST Countries a World Bank API o UN Stats como parte de la tarea de CDN.
