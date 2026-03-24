// Tabla de mapeo ISO 3166-1 numeric → alpha-2 para los 195 países reconocidos
// (193 miembros ONU + Vaticano + Palestina como estados observadores).
// Las claves son strings con ceros iniciales, tal como aparecen en el TopoJSON de world-atlas.

export const ISO_NUMERIC_TO_ALPHA2: Record<string, string> = {
  // A
  '004': 'AF', // Afganistán
  '008': 'AL', // Albania
  '012': 'DZ', // Argelia
  '020': 'AD', // Andorra
  '024': 'AO', // Angola
  '028': 'AG', // Antigua y Barbuda
  '031': 'AZ', // Azerbaiyán
  '032': 'AR', // Argentina
  '036': 'AU', // Australia (también Ashmore en TopoJSON, ignoramos el duplicado)
  '040': 'AT', // Austria
  // B
  '044': 'BS', // Bahamas
  '048': 'BH', // Baréin
  '050': 'BD', // Bangladés
  '051': 'AM', // Armenia
  '052': 'BB', // Barbados
  '056': 'BE', // Bélgica
  '064': 'BT', // Bután
  '068': 'BO', // Bolivia
  '070': 'BA', // Bosnia y Herzegovina
  '072': 'BW', // Botsuana
  '076': 'BR', // Brasil
  '084': 'BZ', // Belice
  '090': 'SB', // Islas Salomón
  '096': 'BN', // Brunéi
  '100': 'BG', // Bulgaria
  '104': 'MM', // Myanmar
  '108': 'BI', // Burundi
  '112': 'BY', // Bielorrusia
  // C
  '116': 'KH', // Camboya
  '120': 'CM', // Camerún
  '124': 'CA', // Canadá
  '132': 'CV', // Cabo Verde
  '140': 'CF', // República Centroafricana
  '144': 'LK', // Sri Lanka
  '148': 'TD', // Chad
  '152': 'CL', // Chile
  '156': 'CN', // China
  '170': 'CO', // Colombia
  '174': 'KM', // Comoras
  '178': 'CG', // Congo (República del)
  '180': 'CD', // Congo (República Democrática del)
  '188': 'CR', // Costa Rica
  '191': 'HR', // Croacia
  '192': 'CU', // Cuba
  '196': 'CY', // Chipre
  '203': 'CZ', // Chequia
  // D
  '204': 'BJ', // Benín
  '208': 'DK', // Dinamarca
  '212': 'DM', // Dominica
  '214': 'DO', // República Dominicana
  '262': 'DJ', // Yibuti
  // E
  '218': 'EC', // Ecuador
  '222': 'SV', // El Salvador
  '226': 'GQ', // Guinea Ecuatorial
  '231': 'ET', // Etiopía
  '232': 'ER', // Eritrea
  '233': 'EE', // Estonia
  '818': 'EG', // Egipto
  '748': 'SZ', // Esuatini
  // F
  '242': 'FJ', // Fiyi
  '246': 'FI', // Finlandia
  '250': 'FR', // Francia
  // G
  '266': 'GA', // Gabón
  '268': 'GE', // Georgia
  '270': 'GM', // Gambia
  '276': 'DE', // Alemania
  '288': 'GH', // Ghana
  '300': 'GR', // Grecia
  '308': 'GD', // Granada
  '320': 'GT', // Guatemala
  '324': 'GN', // Guinea
  '328': 'GY', // Guyana
  '624': 'GW', // Guinea-Bisáu
  // H
  '332': 'HT', // Haití
  '340': 'HN', // Honduras
  '348': 'HU', // Hungría
  // I
  '352': 'IS', // Islandia
  '356': 'IN', // India
  '360': 'ID', // Indonesia
  '364': 'IR', // Irán
  '368': 'IQ', // Irak
  '372': 'IE', // Irlanda
  '376': 'IL', // Israel
  '380': 'IT', // Italia
  '384': 'CI', // Costa de Marfil
  // J
  '388': 'JM', // Jamaica
  '392': 'JP', // Japón
  '400': 'JO', // Jordania
  // K
  '398': 'KZ', // Kazajistán
  '404': 'KE', // Kenia
  '296': 'KI', // Kiribati
  '408': 'KP', // Corea del Norte
  '410': 'KR', // Corea del Sur
  '414': 'KW', // Kuwait
  '417': 'KG', // Kirguistán
  // L
  '418': 'LA', // Laos
  '422': 'LB', // Líbano
  '426': 'LS', // Lesoto
  '428': 'LV', // Letonia
  '430': 'LR', // Liberia
  '434': 'LY', // Libia
  '438': 'LI', // Liechtenstein
  '440': 'LT', // Lituania
  '442': 'LU', // Luxemburgo
  // M
  '450': 'MG', // Madagascar
  '454': 'MW', // Malaui
  '458': 'MY', // Malasia
  '462': 'MV', // Maldivas
  '466': 'ML', // Malí
  '470': 'MT', // Malta
  '584': 'MH', // Islas Marshall
  '478': 'MR', // Mauritania
  '480': 'MU', // Mauricio
  '484': 'MX', // México
  '583': 'FM', // Micronesia
  '498': 'MD', // Moldavia
  '492': 'MC', // Mónaco
  '496': 'MN', // Mongolia
  '499': 'ME', // Montenegro
  '504': 'MA', // Marruecos
  '508': 'MZ', // Mozambique
  '807': 'MK', // Macedonia del Norte
  // N
  '516': 'NA', // Namibia
  '520': 'NR', // Nauru
  '524': 'NP', // Nepal
  '528': 'NL', // Países Bajos
  '554': 'NZ', // Nueva Zelanda
  '558': 'NI', // Nicaragua
  '562': 'NE', // Níger
  '566': 'NG', // Nigeria
  '578': 'NO', // Noruega
  // O
  '512': 'OM', // Omán
  // P
  '586': 'PK', // Pakistán
  '585': 'PW', // Palaos
  '275': 'PS', // Palestina (estado observador ONU)
  '591': 'PA', // Panamá
  '598': 'PG', // Papúa Nueva Guinea
  '600': 'PY', // Paraguay
  '604': 'PE', // Perú
  '608': 'PH', // Filipinas
  '616': 'PL', // Polonia
  '620': 'PT', // Portugal
  // Q
  '634': 'QA', // Catar
  // R
  '642': 'RO', // Rumanía
  '643': 'RU', // Rusia
  '646': 'RW', // Ruanda
  // S
  '659': 'KN', // San Cristóbal y Nieves
  '662': 'LC', // Santa Lucía
  '670': 'VC', // San Vicente y las Granadinas
  '882': 'WS', // Samoa
  '674': 'SM', // San Marino
  '678': 'ST', // Santo Tomé y Príncipe
  '682': 'SA', // Arabia Saudita
  '686': 'SN', // Senegal
  '688': 'RS', // Serbia
  '690': 'SC', // Seychelles
  '694': 'SL', // Sierra Leona
  '702': 'SG', // Singapur
  '703': 'SK', // Eslovaquia
  '705': 'SI', // Eslovenia
  '706': 'SO', // Somalia
  '710': 'ZA', // Sudáfrica
  '728': 'SS', // Sudán del Sur
  '724': 'ES', // España
  '729': 'SD', // Sudán
  '740': 'SR', // Surinam
  '752': 'SE', // Suecia
  '756': 'CH', // Suiza
  '760': 'SY', // Siria
  // T
  '762': 'TJ', // Tayikistán
  '764': 'TH', // Tailandia
  '626': 'TL', // Timor Oriental
  '768': 'TG', // Togo
  '776': 'TO', // Tonga
  '780': 'TT', // Trinidad y Tobago
  '788': 'TN', // Túnez
  '792': 'TR', // Turquía
  '795': 'TM', // Turkmenistán
  '798': 'TV', // Tuvalu
  '834': 'TZ', // Tanzania
  // U
  '800': 'UG', // Uganda
  '804': 'UA', // Ucrania
  '784': 'AE', // Emiratos Árabes Unidos
  '826': 'GB', // Reino Unido
  '840': 'US', // Estados Unidos
  '854': 'BF', // Burkina Faso
  '858': 'UY', // Uruguay
  '860': 'UZ', // Uzbekistán
  // V
  '336': 'VA', // Vaticano (estado observador ONU)
  '862': 'VE', // Venezuela
  '704': 'VN', // Vietnam
  '548': 'VU', // Vanuatu
  // Y
  '887': 'YE', // Yemen
  // Z
  '894': 'ZM', // Zambia
  '716': 'ZW', // Zimbabue
};

// Mapeo inverso: alpha-2 → numeric
export const ISO_ALPHA2_TO_NUMERIC: Record<string, string> = Object.fromEntries(
  Object.entries(ISO_NUMERIC_TO_ALPHA2).map(([num, alpha]) => [alpha, num]),
);

// Set con los 195 códigos alpha-2 reconocidos
export const UN_COUNTRY_CODES: ReadonlySet<string> = new Set(
  Object.values(ISO_NUMERIC_TO_ALPHA2),
);

// --- Territorios no reconocidos por la ONU ---
// Aparecen en Natural Earth 50m pero no son miembros ni observadores de la ONU.
// Son seleccionables en Explorar con ficha + disclaimer, pero no participan en el juego.

import type { Continent } from './types';

interface NonUnTerritory {
  cca2: string;
  continent: Continent;
  sovereignCca2?: string;  // cca2 del país soberano (ausente = soberanía en disputa)
}

/** Mapeo por ID numérico del TopoJSON → territorio no-ONU */
export const NON_UN_TERRITORIES_BY_ID: Record<string, NonUnTerritory> = {
  // Soberanía en disputa (sin sovereignCca2)
  '158': { cca2: 'TW', continent: 'Asia' },           // Taiwán
  '732': { cca2: 'EH', continent: 'África' },          // Sáhara Occidental
  '238': { cca2: 'FK', continent: 'América' },         // Islas Malvinas
  // Territorios de Estados Unidos
  '630': { cca2: 'PR', continent: 'América', sovereignCca2: 'US' },   // Puerto Rico
  '316': { cca2: 'GU', continent: 'Oceanía', sovereignCca2: 'US' },   // Guam
  '016': { cca2: 'AS', continent: 'Oceanía', sovereignCca2: 'US' },   // Samoa Americana
  '580': { cca2: 'MP', continent: 'Oceanía', sovereignCca2: 'US' },   // Islas Marianas del Norte
  '850': { cca2: 'VI', continent: 'América', sovereignCca2: 'US' },   // Islas Vírgenes de EE.UU.
  // Territorios del Reino Unido
  '060': { cca2: 'BM', continent: 'América', sovereignCca2: 'GB' },   // Bermudas
  '092': { cca2: 'VG', continent: 'América', sovereignCca2: 'GB' },   // Islas Vírgenes Británicas
  '136': { cca2: 'KY', continent: 'América', sovereignCca2: 'GB' },   // Islas Caimán
  '796': { cca2: 'TC', continent: 'América', sovereignCca2: 'GB' },   // Islas Turcas y Caicos
  '832': { cca2: 'JE', continent: 'Europa', sovereignCca2: 'GB' },    // Jersey
  '831': { cca2: 'GG', continent: 'Europa', sovereignCca2: 'GB' },    // Guernsey
  '833': { cca2: 'IM', continent: 'Europa', sovereignCca2: 'GB' },    // Isla de Man
  '500': { cca2: 'MS', continent: 'América', sovereignCca2: 'GB' },   // Montserrat
  '660': { cca2: 'AI', continent: 'América', sovereignCca2: 'GB' },   // Anguila
  '654': { cca2: 'SH', continent: 'África', sovereignCca2: 'GB' },    // Santa Elena
  '612': { cca2: 'PN', continent: 'Oceanía', sovereignCca2: 'GB' },   // Islas Pitcairn
  // Territorios de Francia
  '540': { cca2: 'NC', continent: 'Oceanía', sovereignCca2: 'FR' },   // Nueva Caledonia
  '258': { cca2: 'PF', continent: 'Oceanía', sovereignCca2: 'FR' },   // Polinesia Francesa
  '666': { cca2: 'PM', continent: 'América', sovereignCca2: 'FR' },   // San Pedro y Miquelón
  '663': { cca2: 'MF', continent: 'América', sovereignCca2: 'FR' },   // San Martín
  '652': { cca2: 'BL', continent: 'América', sovereignCca2: 'FR' },   // San Bartolomé
  '876': { cca2: 'WF', continent: 'Oceanía', sovereignCca2: 'FR' },   // Wallis y Futuna
  // Territorios de Francia (ultramar, separados del MultiPolygon metropolitano)
  '254': { cca2: 'GF', continent: 'América', sovereignCca2: 'FR' },   // Guayana Francesa
  '312': { cca2: 'GP', continent: 'América', sovereignCca2: 'FR' },   // Guadalupe
  '474': { cca2: 'MQ', continent: 'América', sovereignCca2: 'FR' },   // Martinica
  '638': { cca2: 'RE', continent: 'África', sovereignCca2: 'FR' },    // Reunión
  '175': { cca2: 'YT', continent: 'África', sovereignCca2: 'FR' },    // Mayotte
  // Territorios de Países Bajos
  '533': { cca2: 'AW', continent: 'América', sovereignCca2: 'NL' },   // Aruba
  '531': { cca2: 'CW', continent: 'América', sovereignCca2: 'NL' },   // Curazao
  '534': { cca2: 'SX', continent: 'América', sovereignCca2: 'NL' },   // Sint Maarten
  // Territorios de Dinamarca
  '304': { cca2: 'GL', continent: 'América', sovereignCca2: 'DK' },   // Groenlandia
  '234': { cca2: 'FO', continent: 'Europa', sovereignCca2: 'DK' },    // Islas Feroe
  // Territorios de China
  '344': { cca2: 'HK', continent: 'Asia', sovereignCca2: 'CN' },      // Hong Kong
  '446': { cca2: 'MO', continent: 'Asia', sovereignCca2: 'CN' },      // Macao
  // Territorios de Nueva Zelanda
  '570': { cca2: 'NU', continent: 'Oceanía', sovereignCca2: 'NZ' },   // Niue
  '184': { cca2: 'CK', continent: 'Oceanía', sovereignCca2: 'NZ' },   // Islas Cook
  // Otros
  '248': { cca2: 'AX', continent: 'Europa', sovereignCca2: 'FI' },    // Åland (Finlandia)
  '574': { cca2: 'NF', continent: 'Oceanía', sovereignCca2: 'AU' },   // Isla Norfolk (Australia)
};

/** Mapeo por nombre para territorios sin ID numérico en el TopoJSON */
export const NON_UN_TERRITORIES_BY_NAME: Record<string, NonUnTerritory> = {
  'Kosovo':       { cca2: 'XK', continent: 'Europa' },
  'Somaliland':   { cca2: 'SOL', continent: 'África' },  // Sin código ISO oficial
  'N. Cyprus':    { cca2: 'CYN', continent: 'Europa' },  // Sin código ISO oficial
};

/** Set con todos los códigos alpha-2 de territorios no-ONU */
export const NON_UN_CODES: ReadonlySet<string> = new Set([
  ...Object.values(NON_UN_TERRITORIES_BY_ID).map(t => t.cca2),
  ...Object.values(NON_UN_TERRITORIES_BY_NAME).map(t => t.cca2),
]);
