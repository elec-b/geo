# Spike: Divergencias CLDR vs Wikipedia — nombres de países (10 idiomas Grupo B)

**Fecha**: 2026-03-28
**Contexto**: Comparación exhaustiva de los nombres de países actuales (CLDR + overrides existentes) contra los títulos de artículos Wikipedia en cada idioma. Complementa la sección 1.4 de `verificacion-i18n-datos.md`.
**Método**: Script automático (`scripts/compare-cldr-wikipedia.ts`) + revisión por agent team (2 auditores + 2 refutadores).

---

## Resumen

| Idioma | Divergencias | CLDR | Wikipedia/Otro | Overrides |
|--------|-------------|------|----------------|-----------|
| hi (Hindi) | 102 | 83 | 19 | 19 |
| vi (Vietnamita) | 42 | 13 | 29 | 29 |
| ms (Malayo) | 25 | 11 | 14 | 14 |
| pt-PT (Portugués Portugal) | 35 | 24 | 11 | 11 |
| da (Danés) | 17 | 9 | 8 | 6 (*) |
| th (Tailandés) | 40 | 35 | 5 | 5 |
| it (Italiano) | 20 | 13 | 7 | 5 (*) |
| ro (Rumano) | 17 | 13 | 4 | 4 |
| pt-BR (Portugués Brasil) | 38 | 36 | 2 | 2 |
| sv (Sueco) | 10 | 10 | 0 | 0 |
| **Total** | **346** | **247** | **99** | **95** |

(*) Overrides descartados: it/SZ y da/SZ ya tienen override "Swaziland" de tarea anterior. Correcciones del Refutador A: ms/TR vuelve a CLDR (Turquía pidió "Türkiye"); ms/CV→"Cabo Verde" (nombre oficial); it/GF y it/PF añadidos ("francese" en minúscula, correcto en italiano).

**Resultado**: 95 overrides nuevos a añadir a `country-name-overrides.json`. 247 divergencias son variantes legítimas donde CLDR es correcto o preferible.

---

## hi — Hindi (102 divergencias)

| País | Actual (CLDR+overrides) | Wikipedia | Recomendación |
|------|------------------------|-----------|---------------|
| AD | एंडोरा | अण्डोरा | CLDR (ambas transliteraciones válidas; CLDR más común en uso moderno) |
| AF | अफ़गानिस्तान | अफ़ग़ानिस्तान | Wikipedia (doble nuqta refleja mejor la fonética persa original) |
| AG | एंटिगुआ और बरबुडा | अण्टीगुआ और बारबूडा | CLDR (anusvara moderno estándar) |
| AI | एंग्विला | अंगुइला | CLDR (forma estándar en hindi moderno) |
| AM | आर्मेनिया | आर्मीनिया | CLDR (ambas aceptables; CLDR más usada en medios) |
| AR | अर्जेंटीना | अर्जेण्टीना | CLDR (anusvara estándar en hindi moderno) |
| AX | एलैंड द्वीपसमूह | ऑलैण्ड द्वीपसमूह | Wikipedia (ऑलैण्ड más fiel a la pronunciación sueca "Åland") |
| AZ | अज़रबैजान | अज़रबाइजान | CLDR (variante menor; CLDR consistente) |
| BA | बोस्निया और हर्ज़ेगोविना | बॉस्निया और हर्ज़ेगोविना | CLDR (diferencia mínima de vocal) |
| BF | बुर्किना फ़ासो | बुर्किना फासो | CLDR (nuqta marca mejor el sonido /f/ original) |
| BI | बुरुंडी | बुरुण्डी | CLDR (anusvara estándar en hindi moderno) |
| BN | ब्रूनेई | ब्रुनेई | CLDR (diferencia de longitud vocálica menor) |
| BW | बोत्स्वाना | बोत्सवाना | CLDR (variante menor de conjunción consonántica) |
| CH | स्विट्ज़रलैंड | स्विट्ज़रलैण्ड | CLDR (anusvara estándar; diferencia ortográfica menor) |
| CI | कोत दिवुआर | कोत दिव्वार | CLDR (transliteración estándar del francés) |
| CM | कैमरून | कैमरुन | CLDR (forma más común en medios hindi) |
| CN | चीन | चीनी जनवादी गणराज्य | CLDR (nombre corto estándar; Wikipedia usa nombre oficial largo) |
| CO | कोलंबिया | कोलम्बिया | CLDR (anusvara estándar; diferencia ortográfica menor) |
| CR | कोस्टारिका | कोस्ता रीका | CLDR (forma compacta estándar) |
| CV | केप वर्ड | केप वर्दे | Wikipedia (केप वर्दे refleja mejor la pronunciación portuguesa "Verde") |
| CW | कुरासाओ | क्युरासाओ | CLDR (forma más sencilla) |
| CZ | चेकिया | चेक गणराज्य | CLDR (forma corta moderna adoptada oficialmente) |
| DO | डोमिनिकन गणराज्य | दोमिनिकन गणराज्य | CLDR (transliteración estándar con ड) |
| EC | इक्वाडोर | ईक्वाडोर | CLDR (diferencia de longitud vocálica menor) |
| ER | इरिट्रिया | इरित्रिया | CLDR (variante menor de conjunción consonántica) |
| ET | इथियोपिया | इथोपिया | CLDR (forma más completa, refleja mejor la pronunciación) [REF-A: Confirmado] |
| FM | माइक्रोनेशिया | संघीकृत राज्य माइक्रोनेशिया | CLDR (nombre corto estándar para app de geografía) |
| FO | फ़ेरो द्वीपसमूह | फ़रो द्वीपसमूह | CLDR (diferencia vocálica menor) |
| FR | फ़्रांस | फ़्रान्स | CLDR (anusvara estándar; ambas correctas) |
| GA | गैबॉन | गबोन | CLDR (transliteración más reconocible en hindi) |
| GF | फ़्रेंच गुयाना | फ्रांसीसी गुयाना | Wikipedia (फ्रांसीसी es adjetivo hindi nativo; "फ़्रेंच" es anglicismo) [REF-A: Confirmado — consistente con PF] |
| GG | गर्नसी | ग्वेर्नसे | CLDR (forma simplificada más usada) |
| GL | ग्रीनलैंड | ग्रीनलैण्ड | CLDR (anusvara estándar; diferencia ortográfica menor) |
| GP | ग्वाडेलूप | गुआदेलूप | CLDR (transliteración estándar) |
| GQ | इक्वेटोरियल गिनी | भूमध्यरेखीय गिनी | Wikipedia (भूमध्यरेखीय es traducción hindi nativa, no anglicismo) [REF-A: Confirmado — "इक्वेटोरियल" es anglicismo directo; el hindi nativo "भूमध्यरेखीय" es preferible] |
| GW | गिनी-बिसाउ | गिनी-बिसाऊ | CLDR (diferencia mínima de matra) |
| GY | गुयाना | गयाना | CLDR (forma estándar en hindi) |
| HK | हाँग काँग | हॉन्ग कॉन्ग | CLDR (chandrabindu más natural en hindi) |
| HN | होंडूरास | हौण्डुरस | CLDR (forma más reconocible en medios hindi) |
| HT | हैती | हाइती | CLDR (forma más común en medios hindi) |
| IE | आयरलैंड | आयरलैण्ड गणराज्य | CLDR (nombre corto estándar; "गणराज्य" innecesario) |
| IQ | इराक | इराक़ | Wikipedia (nuqta क़ refleja fielmente la qāf árabe original) [REF-A: Confirmado — la nuqta para qāf es fonéticamente correcta, aunque en la práctica muchos hablantes omiten la nuqta; mantener por precisión] |
| IS | आइसलैंड | आइसलैण्ड | CLDR (anusvara estándar; diferencia ortográfica menor) |
| KE | केन्या | कीनिया | CLDR (forma estándar en hindi moderno) |
| KH | कंबोडिया | कम्बोडिया | CLDR (anusvara estándar) |
| KN | सेंट किट्स और नेविस | सेंट किट्स एंड नेविस | CLDR (usa "और" que es hindi; "एंड" en Wikipedia es anglicismo) |
| KY | कैमेन द्वीपसमूह | केमन द्वीपसमूह | CLDR (transliteración estándar) |
| KZ | कज़ाखस्तान | कज़ाख़िस्तान | Wikipedia (nuqta en ख़ refleja mejor la fonética kazaja original) |
| LC | सेंट लूसिया | सेण्ट लूसिया | CLDR (anusvara más natural en hindi moderno) |
| LI | लिचेंस्टीन | लिख्टेंश्टाइन | Wikipedia (लिख्टेंश्टाइन más fiel al alemán "Liechtenstein") [REF-A: Confirmado — "लिचेंस्टीन" es anglicismo de "Lichtenstein"; la pronunciación alemana es /lɪçtənʃtaɪn/] |
| LS | लेसोथो | लिसूतू | CLDR (forma más reconocible internacionalmente) [REF-A: Confirmado — "लिसूतू" refleja la pronunciación sesotho, pero "लेसोथो" es ampliamente reconocido] |
| LU | लग्ज़मबर्ग | लक्ज़मबर्ग | CLDR (variante menor; ambas aceptables) |
| ME | मोंटेनेग्रो | मॉन्टेनीग्रो | CLDR (forma más simple y reconocible) |
| MF | सेंट मार्टिन | सेंट मार्टिन की सामूहिकता | CLDR (nombre corto estándar para app) |
| MK | उत्तरी मकदूनिया | उत्तर मैसिडोनिया | CLDR (forma oficial aceptada en hindi) |
| MM | म्यांमार (बर्मा) | म्यान्मार | CLDR ("(बर्मा)" ayuda al reconocimiento) |
| MO | मकाऊ | मकाउ | CLDR (diferencia mínima de matra) |
| MP | उत्तरी मारियाना द्वीपसमूह | उत्तरी मारियाना द्वीप | CLDR (द्वीपसमूह = archipiélago, más preciso) |
| MR | मॉरिटानिया | मॉरीतानिया | CLDR (forma estándar CLDR) |
| MS | मोंटसेरात | मॉण्टसेराट | CLDR (forma más simple) |
| MU | मॉरीशस | मॉरिशस | CLDR (diferencia de matra menor) |
| MX | मैक्सिको | मेक्सिको | Wikipedia (मेक्सिको más fiel a la pronunciación española original) [REF-A: Confirmado — la "ै" matra en "मैक्सिको" refleja inglés "Mexico" /mɛ/; "मेक्सिको" con "े" es más fiel al español "México" /me/] |
| MZ | मोज़ांबिक | मोज़ाम्बीक | CLDR (forma más estándar) |
| NC | न्यू कैलेडोनिया | नया कैलेडोनिया | Wikipedia (नया es hindi nativo; "न्यू" es anglicismo directo) [REF-A: Confirmado — "नया" (nayā) es palabra hindi estándar] |
| NF | नॉरफ़ॉक द्वीप | नॉर्फ़ोक द्वीप | CLDR (variante menor de transliteración) |
| NL | नीदरलैंड | नीदरलैंड राज्य | CLDR (nombre corto estándar) |
| NU | नीयू | निउए | Wikipedia (निउए más fiel a la pronunciación nativa "Niue") |
| NZ | न्यूज़ीलैंड | न्यूज़ीलैण्ड | CLDR (anusvara estándar; diferencia ortográfica menor) |
| PF | फ़्रेंच पोलिनेशिया | फ़्रान्सीसी पॉलिनेशिया | Wikipedia (फ़्रान्सीसी es adjetivo hindi correcto; "फ़्रेंच" es anglicismo) [REF-A: Confirmado — consistente con GF] |
| PH | फ़िलिपींस | फ़िलीपीन्स | CLDR (forma estándar más usada en medios) |
| PM | सेंट पिएरे और मिक्वेलान | सन्त पियर और मिकलान | CLDR (forma más reconocible) |
| PN | पिटकैर्न द्वीपसमूह | पिटकेर्न द्वीपसमूह | CLDR (variante menor de transliteración) |
| PR | पोर्टो रिको | पोर्टो रीको | CLDR (diferencia de longitud vocálica menor) |
| PS | फ़िलिस्तीन | फ़िलिस्तीन राज्य | CLDR (nombre corto estándar para app) |
| PW | पलाऊ | पलाउ | CLDR (diferencia mínima de matra) |
| PY | पराग्वे | पैराग्वे | CLDR (forma más estándar en hindi) |
| RE | रियूनियन | रेयूनियों | CLDR (forma más simple y reconocible) |
| RW | रवांडा | रुआण्डा | CLDR (forma más reconocible internacionalmente) [REF-A: RECHAZADO — "रुआण्डा" es más fiel a la pronunciación kinyarwanda /ɾwanda/; "रवांडा" es anglicismo. Recomendación: Wikipedia] |
| SA | सऊदी अरब | सउदी अरब | CLDR (diferencia mínima; CLDR estándar) |
| SB | सोलोमन द्वीपसमूह | सोलोमन द्वीप | CLDR (द्वीपसमूह = archipiélago, más preciso) |
| SH | सेंट हेलेना | सन्त हेलेना, असेंशन और ट्रिस्टन डा कुन्हा | CLDR (nombre corto estándar para app) |
| SM | सैन मेरीनो | सान मारिनो | Wikipedia (सान मारिनो más fiel al italiano "San Marino") |
| ST | साओ टोम और प्रिंसिपे | साओ तोमे और प्रिन्सिपी | Wikipedia (más fiel a la pronunciación portuguesa) |
| SV | अल सल्वाडोर | अल साल्वाडोर | CLDR (variante menor; ambas aceptables) |
| SX | सिंट मार्टिन | सिण्ट मार्टेन | Wikipedia (सिण्ट मार्टेन refleja mejor el neerlandés "Sint Maarten") |
| SZ | एस्वाटिनी | एस्वातीनी | CLDR (diferencia de matra menor; CLDR estándar) |
| TC | तुर्क और कैकोज़ द्वीपसमूह | तुर्क और केकोस द्वीपसमूह | CLDR (forma estándar) |
| TH | थाईलैंड | थाईलैण्ड | CLDR (anusvara estándar; diferencia ortográfica menor) |
| TL | पूर्वी तिमोर | पूर्व तिमोर | CLDR (पूर्वी es forma adjetival correcta en hindi) |
| TN | ट्यूनीशिया | तूनिसीया | CLDR (forma más reconocible internacionalmente) [REF-A: RECHAZADO — "ट्यूनीशिया" es anglicismo directo de "Tunisia"; "तूनिसीया" es transliteración más cercana al nombre árabe/francés "Tunisie/Tūnis". Recomendación: Wikipedia] |
| TR | तुर्किये | तुर्की | CLDR (refleja el nombre oficial moderno "Türkiye") [REF-A: Confirmado — "तुर्किये" refleja el cambio oficial de 2022; mantener CLDR] |
| TW | ताइवान | चीनी गणराज्य | CLDR (nombre corto estándar y más reconocible) |
| UA | यूक्रेन | युक्रेन | CLDR (forma más reconocible en hindi moderno) |
| UG | युगांडा | युगाण्डा | CLDR (anusvara estándar) |
| US | संयुक्त राज्य | संयुक्त राज्य अमेरिका | Wikipedia (संयुक्त राज्य अमेरिका más claro y completo) [REF-A: Confirmado — "संयुक्त राज्य" solo es ambiguo; "अमेरिका" necesario para desambiguar] |
| UY | उरूग्वे | उरुग्वे | CLDR (diferencia de matra menor) |
| VA | वेटिकन सिटी | वैटिकन सिटी | CLDR (diferencia mínima de matra) |
| VC | सेंट विंसेंट और ग्रेनाडाइंस | सेंट विंसेंट एवं ग्रेनाडींस | CLDR (forma estándar) |
| VI | यू॰एस॰ वर्जिन द्वीपसमूह | संयुक्त राज्य वर्जिन द्वीपसमूह | CLDR (forma abreviada estándar) |
| VU | वनुआतू | वानूआतू | CLDR (forma estándar CLDR) [REF-A: RECHAZADO — "वानूआतू" es más fiel a la pronunciación nativa /vanuatu/ con vocal larga inicial; Wikipedia prefiere esta forma. Recomendación: Wikipedia] |
| XK | कोसोवो | कोसोवो गणराज्य | CLDR (nombre corto estándar) |
| YT | मायोते | मायोत | CLDR (forma estándar) |

---

## pt-BR — Portugués (Brasil) (38 divergencias)

| País | Actual (CLDR+overrides) | Wikipedia | Recomendación |
|------|------------------------|-----------|---------------|
| AM | Armênia | Arménia | CLDR (variante ortográfica pt-BR legítima: ê vs é) |
| AX | Ilhas Aland | Ilhas Åland | Wikipedia (Åland con diéresis es la grafía correcta del topónimo) |
| BF | Burquina Faso | Burquina Fasso | CLDR (ambas formas existem; "Faso" é mais comum no Brasil) |
| BH | Barein | Bahrein | Wikipedia (Bahrein é a forma mais usada em pt-BR, inclusive na mídia) |
| BJ | Benin | Benim | CLDR (Benin é a forma padrão em pt-BR) |
| BW | Botsuana | Botswana | CLDR (Botsuana é a forma aportuguesada padrão em pt-BR) |
| CW | Curaçao | Curaçau | CLDR (Curaçao é a forma mais reconhecida em pt-BR) |
| CZ | Tchéquia | Chéquia | CLDR (Tchéquia é a forma pt-BR; Chéquia é pt-PT) |
| EE | Estônia | Estónia | CLDR (variante ortográfica pt-BR legítima: ô vs ó) |
| FM | Micronésia | Estados Federados da Micronésia | CLDR (nome curto preferível para app; forma longa é oficial mas desnecessária) |
| FO | Ilhas Faroé | Ilhas Feroe | CLDR (Faroé é a forma mais comum em pt-BR) |
| GL | Groenlândia | Gronelândia | CLDR (Groenlândia é a forma consolidada em pt-BR) |
| KE | Quênia | Quénia | CLDR (variante ortográfica pt-BR legítima: ê vs é) |
| KI | Quiribati | Quiribáti | CLDR (Quiribati sem acento é a forma mais usada em pt-BR) |
| KN | São Cristóvão e Névis | São Cristóvão e Neves | CLDR (Névis é a forma mais usada em pt-BR) |
| LV | Letônia | Letónia | CLDR (variante ortográfica pt-BR legítima: ô vs ó) |
| MC | Mônaco | Mónaco | CLDR (variante ortográfica pt-BR legítima: ô vs ó) |
| MG | Madagascar | Madagáscar | CLDR (Madagascar é a forma padrão em pt-BR; Madagáscar é pt-PT) |
| MK | Macedônia do Norte | Macedónia do Norte | CLDR (variante ortográfica pt-BR legítima: ô vs ó) |
| MM | Mianmar (Birmânia) | Myanmar | CLDR (Mianmar é a forma aportuguesada usada no Brasil) |
| MP | Ilhas Marianas do Norte | Ilhas Marianas Setentrionais | CLDR (ambas corretas; "do Norte" é mais natural em pt-BR) |
| MS | Montserrat | Monserrate | CLDR (Montserrat é a forma mais reconhecida internacionalmente) |
| MU | Maurício | Maurícia | CLDR (Maurício é a forma padrão em pt-BR; Maurícia é pt-PT) |
| MW | Malaui | Malawi | CLDR (Malaui é a forma aportuguesada padrão em pt-BR) |
| NC | Nova Caledônia | Nova Caledónia | CLDR (variante ortográfica pt-BR legítima: ô vs ó) |
| NF | Ilha Norfolk | Ilha Norfolque | CLDR (Norfolk é a forma mais usada em pt-BR) |
| NL | Países Baixos | Reino dos Países Baixos | CLDR (nome curto preferível; "Reino dos" é a forma longa oficial) |
| PL | Polônia | Polónia | CLDR (variante ortográfica pt-BR legítima: ô vs ó) |
| PS | Palestina | Estado da Palestina | CLDR (nome curto preferível para app) |
| SH | Santa Helena | Santa Helena, Ascensão e Tristão da Cunha | CLDR (nome curto preferível para app) |
| SI | Eslovênia | Eslovénia | CLDR (variante ortográfica pt-BR legítima: ê vs é) |
| TJ | Tadjiquistão | Tajiquistão | CLDR (Tadjiquistão é a forma mais usada em pt-BR) |
| TM | Turcomenistão | Turquemenistão | CLDR (Turcomenistão é a forma pt-BR; Turquemenistão é pt-PT) |
| TT | Trinidad e Tobago | Trindade e Tobago | CLDR (Trinidad é a forma mais reconhecida em pt-BR) |
| UZ | Uzbequistão | Usbequistão | CLDR (Uzbequistão é a forma padrão em pt-BR) |
| VA | Cidade do Vaticano | Vaticano | CLDR (Cidade do Vaticano é mais específico e correto) |
| YE | Iêmen | Iémen | CLDR (variante ortográfica pt-BR legítima: ê vs é) |
| ZW | Zimbábue | Zimbabwe | CLDR (Zimbábue é a forma aportuguesada padrão em pt-BR) |

---

## pt-PT — Portugués (Portugal) (35 divergencias)

| País | Actual (CLDR+overrides) | Wikipedia | Recomendación |
|------|------------------------|-----------|---------------|
| AX | Alanda | Ilhas Åland | Wikipedia (Ilhas Åland é a forma correta com diérese; "Alanda" é uma adaptação incomum) |
| BD | Bangladeche | Bangladesh | CLDR (Bangladeche é a forma aportuguesada pt-PT legítima) |
| BF | Burquina Faso | Burquina Fasso | CLDR (ambas existem; "Faso" é a mais usada em pt-PT) |
| BH | Barém | Bahrein | CLDR (Barém é a forma aportuguesada pt-PT reconhecida) |
| BS | Baamas | Bahamas | Wikipedia (Bahamas é a forma predominante mesmo em pt-PT) |
| BW | Botsuana | Botswana | CLDR (Botsuana é a forma aportuguesada pt-PT padrão) |
| DJ | Jibuti | Djibuti | Wikipedia (Djibuti é a forma mais usada em pt-PT, preserva a grafia francesa) |
| DM | Domínica | Dominica | CLDR (Domínica com acento é a forma pt-PT estabelecida) |
| EH | Sara Ocidental | Saara Ocidental | Wikipedia (Saara com duplo "a" é a forma mais usada em pt-PT) |
| FK | Ilhas Falkland | Ilhas Malvinas | CLDR (Falkland é o nome internacional neutro; "Malvinas" é a denominação argentina) |
| FM | Micronésia | Estados Federados da Micronésia | CLDR (nome curto preferível para app) |
| FO | Ilhas Faroé | Ilhas Feroe | CLDR (Faroé é a forma mais comum em pt-PT) |
| GG | Guernesey | Guernsey | Wikipedia (Guernsey é a grafia original e mais reconhecida) |
| GU | Guame | Guam | Wikipedia (Guam é a forma mais reconhecida internacionalmente) |
| IR | Irão | Irã | CLDR (Irão é a forma pt-PT correcta; Irã é pt-BR) |
| KW | Koweit | Kuwait | Wikipedia (Kuwait é a forma mais usada actualmente em pt-PT) |
| KY | Ilhas Caimão | Ilhas Cayman | CLDR (Caimão é a forma aportuguesada pt-PT) |
| LI | Listenstaine | Liechtenstein | Wikipedia (Liechtenstein é a forma mais usada em pt-PT na prática) |
| LK | Sri Lanca | Sri Lanka | Wikipedia (Sri Lanka é a forma original e mais usada em pt-PT) |
| MF | São Martinho (Saint-Martin) | São Martinho | Otro: São Martinho (remover o parêntese "Saint-Martin" para simplificar) |
| MM | Mianmar (Birmânia) | Myanmar | CLDR (Mianmar com nota é informativo para utilizadores pt-PT) |
| MP | Ilhas Marianas do Norte | Ilhas Marianas Setentrionais | CLDR ("do Norte" é mais natural e directo) |
| MW | Maláui | Malawi | CLDR (Maláui é a forma aportuguesada pt-PT) |
| NF | Ilha Norfolk | Ilha Norfolque | CLDR (Norfolk é a forma mais reconhecida) |
| NL | Países Baixos | Reino dos Países Baixos | CLDR (nome curto preferível para app) |
| NU | Niuê | Niue | CLDR (Niuê é a forma aportuguesada pt-PT) |
| PS | Palestina | Estado da Palestina | CLDR (nome curto preferível para app) |
| RO | Roménia | Romênia | CLDR (Roménia é a forma pt-PT; Romênia é pt-BR) |
| SH | Santa Helena | Santa Helena, Ascensão e Tristão da Cunha | CLDR (nome curto preferível para app) |
| SM | São Marinho | San Marino | CLDR (São Marinho é a forma aportuguesada pt-PT tradicional) [REF-B: Wikipedia — "São Marinho" é uma adaptação histórica em desuso; na prática, a mídia e uso corrente em pt-PT usam "San Marino". A Wikipedia pt-PT confirma "San Marino" como título do artigo] |
| VA | Cidade do Vaticano | Vaticano | CLDR (Cidade do Vaticano é mais específico e correcto) |
| VI | Ilhas Virgens dos EUA | Ilhas Virgens Americanas | Wikipedia (Ilhas Virgens Americanas é mais natural em pt-PT) |
| VN | Vietname | Vietnã | CLDR (Vietname é a forma pt-PT; Vietnã é pt-BR) |
| YT | Maiote | Mayotte | CLDR (Maiote é a forma aportuguesada pt-PT) |
| ZW | Zimbabué | Zimbabwe | CLDR (Zimbabué é a forma aportuguesada pt-PT) |

---

## vi — Vietnamita (42 divergencias)

| País | Actual (CLDR+overrides) | Wikipedia | Recomendación |
|------|------------------------|-----------|---------------|
| AE | Các Tiểu Vương quốc Ả Rập Thống nhất | Các Tiểu vương quốc Ả Rập Thống nhất | CLDR (diferencia solo de mayúscula en "Vương/vương"; ambas válidas) |
| AU | Australia | Úc | Wikipedia ("Úc" es el nombre estándar en vietnamita; "Australia" es anglicismo) [REF-A: Confirmado — "Úc" (de Sino-vietnamita 澳, abreviación de 澳大利) es el nombre estándar universal en vietnamita] |
| AX | Quần đảo Åland | Åland | CLDR (incluir "Quần đảo" = archipiélago ayuda a entender que es territorio insular) |
| BA | Bosnia và Herzegovina | Bosna và Hercegovina | Wikipedia ("Bosna và Hercegovina" es la forma nativa, no anglicismo) [REF-A: Confirmado — "Bosna" y "Hercegovina" son las formas nativas bosnias; las formas inglesas "Bosnia"/"Herzegovina" son innecesarias] |
| BJ | Benin | Bénin | Wikipedia ("Bénin" refleja la ortografía francesa oficial del país) |
| BL | St. Barthélemy | Saint-Barthélemy | Wikipedia ("Saint-Barthélemy" es la forma francesa completa, no abreviatura) |
| BR | Brazil | Brasil | Wikipedia ("Brasil" es el nombre en portugués, más fiel al original) [REF-A: Confirmado — "Brasil" con 's' es la ortografía portuguesa oficial] |
| CV | Cape Verde | Cabo Verde | Wikipedia ("Cabo Verde" es el nombre oficial del país desde 2013) [REF-A: Confirmado — "Cabo Verde" es el nombre oficial solicitado por el propio gobierno] |
| DZ | Algeria | Algérie | Wikipedia ("Algérie" es más cercano al nombre nativo; anglicismo innecesario) [REF-A: Confirmado — Vietnam tiene influencia francesa histórica; "Algérie" es natural] |
| FM | Micronesia | Liên bang Micronesia | CLDR (nombre corto estándar para app de geografía) |
| GB | Vương quốc Anh | Vương quốc Liên hiệp Anh và Bắc Ireland | CLDR (nombre corto estándar; forma larga innecesariamente compleja) |
| GE | Georgia | Gruzia | Wikipedia ("Gruzia" es el nombre tradicional en vietnamita, no anglicismo) [REF-A: Confirmado — "Gruzia" proviene del ruso "Грузия", estándar en vietnamita] |
| GF | Guiana thuộc Pháp | Guyane thuộc Pháp | Wikipedia ("Guyane" es la forma francesa correcta) |
| GG | Guernsey | Địa hạt Guernsey | CLDR (nombre corto estándar; "Địa hạt" innecesario) |
| GN | Guinea | Guinée | Wikipedia ("Guinée" es la forma francesa oficial del país) [REF-A: Confirmado — Vietnam francófono históricamente; formas francesas son naturales en vietnamita para países africanos francófonos] |
| GW | Guinea-Bissau | Guiné-Bissau | Wikipedia ("Guiné-Bissau" es la forma portuguesa oficial) |
| IE | Ireland | Cộng hòa Ireland | CLDR (nombre corto estándar; "Cộng hòa" innecesario) |
| IT | Italy | Ý | Wikipedia ("Ý" es el nombre estándar en vietnamita; "Italy" es anglicismo) [REF-A: Confirmado — "Ý" (de Sino-vietnamita 意, abreviación de 意大利 Ý Đại Lợi) es el nombre estándar universal en vietnamita] |
| KN | St. Kitts và Nevis | Saint Kitts và Nevis | Wikipedia ("Saint" completo es preferible a abreviatura "St.") |
| KP | Triều Tiên | Cộng hòa Dân chủ Nhân dân Triều Tiên | CLDR (nombre corto estándar; forma larga es nombre oficial completo) |
| LB | Li-băng | Liban | Wikipedia ("Liban" es forma más natural en vietnamita sin guión) [REF-A: Confirmado — "Li-băng" tiene guión innecesario; "Liban" es forma francesa estándar adoptada en vietnamita] |
| LC | St. Lucia | Saint Lucia | Wikipedia ("Saint" completo es preferible a abreviatura "St.") |
| MA | Ma-rốc | Maroc | Wikipedia ("Maroc" sin guión es más natural; forma francesa estándar) [REF-A: Confirmado — mismo patrón que LB: guión innecesario en CLDR] |
| MF | St. Martin | Saint-Martin | Wikipedia ("Saint-Martin" es la forma francesa oficial completa) |
| MM | Myanmar (Miến Điện) | Myanmar | CLDR ("(Miến Điện)" ayuda al reconocimiento con nombre vietnamita tradicional) |
| MR | Mauritania | Mauritanie | Wikipedia ("Mauritanie" es forma francesa, más natural en vietnamita) |
| MX | Mexico | México | Wikipedia ("México" refleja la ortografía española original) |
| NC | New Caledonia | Nouvelle-Calédonie | Wikipedia ("Nouvelle-Calédonie" es la forma francesa, no anglicismo) |
| NL | Hà Lan | Vương quốc Hà Lan | CLDR (nombre corto estándar; "Hà Lan" es el nombre vietnamita nativo) |
| PA | Panama | Panamá | Wikipedia ("Panamá" refleja la ortografía española original) |
| PE | Peru | Perú | Wikipedia ("Perú" refleja la ortografía española original) |
| PF | Polynesia thuộc Pháp | Polynésie thuộc Pháp | Wikipedia ("Polynésie" es forma francesa correcta) |
| PM | Saint Pierre và Miquelon | Saint-Pierre và Miquelon | Wikipedia (guión en "Saint-Pierre" es la forma francesa oficial) |
| PS | Palestine | Nhà nước Palestine | CLDR (nombre corto estándar para app) |
| RO | Romania | România | Wikipedia ("România" es la ortografía rumana oficial) |
| SA | Ả Rập Xê-út | Ả Rập Xê Út | CLDR (guión en "Xê-út" es forma más establecida en vietnamita) [REF-A: Confirmado — el guión en "Xê-út" refleja la tradición ortográfica vietnamita para préstamos largos] |
| SH | St. Helena | Saint Helena, Ascension và Tristan da Cunha | Otro: Saint Helena ("Saint" completo, sin forma larga innecesaria) |
| SN | Senegal | Sénégal | Wikipedia ("Sénégal" es la forma francesa oficial) |
| TD | Chad | Tchad | Wikipedia ("Tchad" es la forma francesa oficial del país) |
| VC | St. Vincent và Grenadines | Saint Vincent và Grenadines | Wikipedia ("Saint" completo es preferible a abreviatura "St.") |
| VI | Quần đảo Virgin thuộc Hoa Kỳ | Quần đảo Virgin thuộc Mỹ | CLDR ("Hoa Kỳ" es término formal estándar para EE.UU. en vietnamita) |
| ZA | Nam Phi | Cộng hòa Nam Phi | CLDR (nombre corto estándar; "Cộng hòa" innecesario) |

---

## ms — Malayo (25 divergencias)

| País | Actual (CLDR+overrides) | Wikipedia | Recomendación |
|------|------------------------|-----------|---------------|
| AX | Kepulauan Aland | Kepulauan Åland | Wikipedia (ortografía correcta con diéresis "Å") |
| CI | Pantai Gading | Ivory Coast | CLDR ("Pantai Gading" es la traducción malaya nativa; "Ivory Coast" es anglicismo) [REF-A: Confirmado — "Pantai Gading" (= Costa de Marfil) es el exónimo malayo estándar] |
| CV | Cape Verde | Tanjung Verde | Wikipedia ("Tanjung Verde" es la traducción malaya nativa; "Cape Verde" es anglicismo) [REF-A: RECHAZADO — el país cambió su nombre oficial a "Cabo Verde" en 2013 y pidió a la ONU que todos los idiomas usen "Cabo Verde"; recomendación: Otro: "Cabo Verde" (nombre oficial internacional)] |
| CW | Curacao | Curaçao | Wikipedia (ortografía correcta con cedilla "ç") |
| CZ | Czechia | Republik Czech | CLDR (forma corta moderna adoptada oficialmente) |
| DM | Dominica | Dominika | Wikipedia ("Dominika" es adaptación malaya estándar) |
| DO | Republik Dominica | Republik Dominika | Wikipedia ("Dominika" es adaptación malaya estándar) |
| ET | Ethiopia | Habsyah | CLDR ("Ethiopia" es más reconocible internacionalmente; "Habsyah" es arcaísmo) [REF-A: RECHAZADO — "Habsyah" es el título del artículo en Wikipedia ms y proviene del árabe الحبشة (al-Ḥabasha); no es arcaísmo sino el exónimo malayo estándar, como "Yunani" para Grecia. Recomendación: Wikipedia] |
| FM | Micronesia | Negeri Bersekutu Mikronesia | CLDR (nombre corto estándar para app de geografía) |
| GR | Greece | Yunani | Wikipedia ("Yunani" es el nombre malayo nativo; "Greece" es anglicismo) [REF-A: Confirmado — "Yunani" (del árabe يُونَانِيّ vía persa) es el exónimo malayo estándar; "Greece" es anglicismo innecesario] |
| GW | Guinea Bissau | Guinea-Bissau | Wikipedia (guión en "Guinea-Bissau" es la forma oficial internacional) |
| IE | Ireland | Republik Ireland | CLDR (nombre corto estándar; "Republik" innecesario) |
| IM | Isle of Man | Pulau Man | Wikipedia ("Pulau Man" es la traducción malaya nativa; "Isle of Man" es anglicismo) [REF-A: Confirmado — "Pulau" = isla en malayo; consistente con traducir topónimos] |
| MM | Myanmar (Burma) | Myanmar | CLDR ("(Burma)" ayuda al reconocimiento) |
| MO | Macau | Makau | Wikipedia ("Makau" es la adaptación ortográfica malaya estándar) |
| NL | Belanda | Kerajaan Belanda | CLDR (nombre corto estándar; "Belanda" es el nombre malayo nativo) |
| RE | Reunion | Réunion | Wikipedia (ortografía francesa correcta con acento "Réunion") |
| SH | Saint Helena | Saint Helena, Ascension dan Tristan da Cunha | CLDR (nombre corto estándar para app) |
| SR | Surinam | Suriname | Wikipedia ("Suriname" es el nombre oficial del país) [REF-A: Confirmado — "Suriname" es la ortografía oficial del país] |
| ST | Sao Tome dan Principe | São Tomé dan Príncipe | Wikipedia (ortografía portuguesa correcta con diacríticos) |
| TL | Timor Timur | Timor Leste | Wikipedia ("Timor Leste" es el nombre oficial; "Timor Timur" era el nombre indonesio durante la ocupación) [REF-A: Confirmado — "Timor Timur" es el nombre usado durante la ocupación indonesia (1975-2002); usar "Timor Leste" es importante por sensibilidad política] |
| TR | Turkiye | Turki | Wikipedia ("Turki" es el nombre malayo tradicional y más natural) [REF-A: RECHAZADO — "Turki" es el nombre malayo tradicional, pero Turquía solicitó oficialmente en 2022 que se use "Türkiye" en todos los idiomas; "Turkiye" respeta la petición oficial del país. Recomendación: CLDR] |
| VA | Kota Vatican | Kota Vatikan | Wikipedia ("Vatikan" es la adaptación ortográfica malaya estándar) |
| VC | Saint Vincent dan Grenadines | Saint Vincent dan Kepulauan Grenadine | CLDR (forma corta estándar) |
| VI | Kepulauan Virgin A.S. | Kepulauan Virgin Amerika Syarikat | CLDR (forma abreviada estándar) |

---

## th — Tailandés (40 divergencias)

| País | Actual (CLDR+overrides) | Wikipedia | Recomendación |
|------|------------------------|-----------|---------------|
| AG | แอนติกาและบาร์บูดา | แอนทีกาและบาร์บิวดา | CLDR (variante de transliteración menor; CLDR estándar) |
| AM | อาร์เมเนีย | อาร์มีเนีย | CLDR (variante menor de transliteración) |
| BL | เซนต์บาร์เธเลมี | แซ็ง-บาร์เตเลมี | Wikipedia (แซ็ง-บาร์เตเลมี más fiel a la pronunciación francesa) [REF-A: Confirmado — "เซนต์" es anglicismo de "Saint"; "แซ็ง" refleja la pronunciación francesa /sɛ̃/] |
| CV | เคปเวิร์ด | กาบูเวร์ดี | Wikipedia (กาบูเวร์ดี refleja el nombre oficial "Cabo Verde") [REF-A: Confirmado — el país solicitó oficialmente "Cabo Verde" en todos los idiomas] |
| CW | คูราเซา | กูราเซา | CLDR (variante menor de transliteración) |
| CZ | เช็ก | เช็กเกีย | CLDR (forma corta estándar; ambas válidas) |
| DM | โดมินิกา | ดอมินีกา | CLDR (variante menor de transliteración) |
| EH | ซาฮาราตะวันตก | เวสเทิร์นสะฮารา | CLDR (ซาฮาราตะวันตก es traducción tailandesa nativa; Wikipedia usa anglicismo) [REF-A: Confirmado — "ตะวันตก" = occidental en tailandés; usar traducción nativa es preferible] |
| FJ | ฟิจิ | ฟีจี | CLDR (variante menor de longitud vocálica) |
| FM | ไมโครนีเซีย | ไมโครนีเชีย | CLDR (variante menor de transliteración ซ/ช) |
| GD | เกรเนดา | กรีเนดา | CLDR (variante menor de transliteración) |
| GG | เกิร์นซีย์ | เขตเจ้าพนักงานศาลเกิร์นซีย์ | CLDR (nombre corto estándar; forma larga innecesaria) |
| GP | กวาเดอลูป | กัวเดอลุป | CLDR (variante menor de transliteración) |
| IM | เกาะแมน | ไอล์ออฟแมน | CLDR (เกาะแมน es traducción tailandesa nativa; Wikipedia usa anglicismo) |
| LC | เซนต์ลูเซีย | เซนต์ลูเชีย | CLDR (variante menor de transliteración ซ/ช) |
| LI | ลิกเตนสไตน์ | ลีชเทินชไตน์ | Wikipedia (ลีชเทินชไตน์ más fiel al alemán "Liechtenstein") [REF-A: Confirmado — pronunciación alemana /lɪçtənʃtaɪn/ con "ch" /ç/, no "k"] |
| MM | เมียนมา (พม่า) | พม่า | CLDR ("(พม่า)" ayuda al reconocimiento con nombre tailandés tradicional) |
| MQ | มาร์ตินีก | มาร์ตีนิก | CLDR (variante menor de transliteración) |
| NL | เนเธอร์แลนด์ | ราชอาณาจักรเนเธอร์แลนด์ | CLDR (nombre corto estándar; forma con "ราชอาณาจักร" innecesaria) |
| NU | นีอูเอ | นีวเว | CLDR (forma estándar CLDR) |
| PF | เฟรนช์โปลินีเซีย | เฟรนช์พอลินีเชีย | CLDR (variante menor de transliteración) |
| PM | แซงปีแยร์และมีเกอลง | แซ็งปีแยร์และมีเกอลง | CLDR (diferencia mínima de diacrítico; ambas válidas) |
| PR | เปอร์โตริโก | ปวยร์โตรีโก | CLDR (forma estándar más reconocible) |
| PS | ปาเลสไตน์ | รัฐปาเลสไตน์ | CLDR (nombre corto estándar para app) |
| RE | เรอูนียง | เรอูว์นียง | CLDR (variante menor de transliteración) |
| SH | เซนต์เฮเลนา | เซนต์เฮเลนา อัสเซนชัน และตริสตันดากูนยา | CLDR (nombre corto estándar para app) |
| SK | สโลวะเกีย | สโลวาเกีย | CLDR (diferencia mínima de vocal; CLDR estándar) |
| SM | ซานมาริโน | ซานมารีโน | CLDR (variante menor de longitud vocálica) |
| SR | ซูรินาเม | ซูรินาม | CLDR (forma más reconocible internacionalmente) [REF-A: RECHAZADO — "Suriname" con -e final es el nombre oficial del país; "ซูรินาเม" (CLDR) de hecho refleja la ortografía oficial. La forma Wikipedia "ซูรินาม" omite la -e. Mantener CLDR es correcto pero la justificación debería ser "CLDR refleja la ortografía oficial Suriname"] |
| ST | เซาตูเมและปรินซิปี | เซาตูแมอีปริงซีป | CLDR (forma más reconocible y estándar) |
| SX | ซินต์มาร์เทน | ซินต์มาร์เติน | CLDR (variante menor de transliteración) |
| SZ | เอสวาตีนี | เอสวาตินี | CLDR (diferencia mínima de longitud vocálica) |
| TC | หมู่เกาะเติกส์และหมู่เกาะเคคอส | หมู่เกาะเติกส์และเคคอส | Wikipedia (forma más concisa sin repetir "หมู่เกาะ") [REF-A: Confirmado — repetir "หมู่เกาะ" (archipiélago) es redundante] |
| TL | ติมอร์ตะวันออก | ติมอร์-เลสเต | CLDR (ตะวันออก = "oriental" es traducción tailandesa nativa) |
| TO | ตองกา | ตองงา | CLDR (forma estándar más reconocible) |
| VA | นครวาติกัน | นครรัฐวาติกัน | CLDR (forma corta estándar; "รัฐ" innecesario) |
| VI | หมู่เกาะเวอร์จินของสหรัฐอเมริกา | หมู่เกาะเวอร์จินของสหรัฐ | Wikipedia (forma más concisa; "อเมริกา" redundante) [REF-A: Confirmado — "สหรัฐ" solo ya significa EE.UU. en tailandés] |
| VU | วานูอาตู | วานูวาตู | CLDR (variante menor de transliteración) |
| WF | วาลลิสและฟุตูนา | วอลิสและฟูตูนา | CLDR (variante menor de transliteración) |
| XK | โคโซโว | คอซอวอ | CLDR (forma más reconocible internacionalmente) [REF-A: Confirmado — "โคโซโว" refleja la pronunciación más extendida internacionalmente] |

---

## it — Italiano (20 divergencias)

| País | Actual (CLDR+overrides) | Wikipedia | Recomendación |
|------|------------------------|-----------|---------------|
| CI | Costa d’Avorio | Costa d’Avorio | CLDR (idénticos; posible diferencia de tipografía en apóstrofo) [REF-A: Confirmado — diferencia probablemente solo tipográfica (apóstrofo recto vs curvo); no requiere cambio] |
| CZ | Cechia | Repubblica Ceca | CLDR (forma corta moderna adoptada oficialmente; "Repubblica Ceca" es nombre formal) |
| FM | Micronesia | Stati Federati di Micronesia | CLDR (nombre corto estándar para app de geografía) |
| FO | Isole Fær Øer | Fær Øer | CLDR ("Isole" aporta contexto geográfico útil) |
| GF | Guyana Francese | Guyana francese | CLDR (diferencia solo de mayúscula en "Francese/francese"; CLDR es consistente) [REF-A: RECHAZADO — en italiano los adjetivos gentilicios van en minúscula ("francese", no "Francese"); Wikipedia es correcto gramaticalmente. Recomendación: Wikipedia] |
| GG | Guernsey | Baliato di Guernsey | CLDR (nombre corto estándar; "Baliato di" innecesario) |
| JE | Jersey | Baliato di Jersey | CLDR (nombre corto estándar; "Baliato di" innecesario) |
| MC | Monaco | Principato di Monaco | CLDR (nombre corto estándar; "Principato di" innecesario para app) |
| MF | Saint Martin | Saint-Martin | Wikipedia (guión en "Saint-Martin" es la forma francesa oficial) [REF-A: Confirmado — "Saint-Martin" con guión es la forma oficial francesa de la colectividad] |
| MM | Myanmar (Birmania) | Birmania | CLDR (Myanmar es el nombre internacional actual; "(Birmania)" ayuda reconocimiento) |
| NL | Paesi Bassi | Regno dei Paesi Bassi | CLDR (nombre corto estándar; forma con "Regno dei" innecesaria) |
| PF | Polinesia Francese | Polinesia francese | CLDR (diferencia solo de mayúscula; CLDR es consistente con otros territorios) [REF-A: RECHAZADO — mismo caso que GF: en italiano los gentilicios van en minúscula. "Polinesia francese" es gramaticalmente correcto. Recomendación: Wikipedia] |
| PR | Portorico | Porto Rico | Wikipedia ("Porto Rico" en dos palabras es la forma más usada en italiano) [REF-A: Confirmado — Collins Italian Dictionary y fuentes italianas confirman "Porto Rico" (dos palabras)] |
| PS | Palestina | Stato di Palestina | CLDR (nombre corto estándar para app) |
| RE | Riunione | La Riunione | CLDR (forma sin artículo más adecuada para lista de países) |
| SH | Sant’Elena | Sant’Elena, Ascensione e Tristan da Cunha | CLDR (nombre corto estándar para app) |
| SS | Sud Sudan | Sudan del Sud | Wikipedia ("Sudan del Sud" es la forma más usada en italiano) [REF-A: Confirmado — múltiples fuentes italianas (Reverso, bab.la, Med-Or) usan "Sudan del Sud" consistentemente] |
| SZ | Swaziland | ESwatini | Otro: eSwatini (nombre oficial desde 2018; corregir mayúscula de Wikipedia "ESwatini" a "eSwatini") [REF-A: Confirmado — el nombre oficial es "eSwatini" con 'e' minúscula; tanto "Swaziland" (CLDR) como "ESwatini" (Wikipedia) necesitan corrección] |
| TC | Isole Turks e Caicos | Turks e Caicos | CLDR ("Isole" aporta contexto geográfico útil) |
| US | Stati Uniti | Stati Uniti d’America | Wikipedia ("Stati Uniti d’America" más claro y completo) [REF-A: Confirmado — "Stati Uniti" solo es ambiguo; consistente con la recomendación para hi] |

---

## da — Danés (17 divergencias)

| País | Actual (CLDR+overrides) | Wikipedia | Recomendación |
|------|------------------------|-----------|---------------|
| AE | De Forenede Arabiske Emirater | Forenede Arabiske Emirater | CLDR (artiklen "De" er del af det officielle danske navn) |
| BL | Saint Barthélemy | Saint-Barthélemy | Wikipedia (bindestreg er korrekt i det franske officielle navn) |
| CF | Den Centralafrikanske Republik | Centralafrikanske Republik | CLDR (artiklen "Den" er del af det officielle danske navn) |
| DO | Den Dominikanske Republik | Dominikanske Republik | CLDR (artiklen "Den" er del af det officielle danske navn) |
| GG | Guernsey | Bailiwick of Guernsey | CLDR (kort navn foretrækkes til app; "Bailiwick of" er overkill) |
| HK | SAR Hongkong | Hongkong | Wikipedia (Hongkong uden "SAR" er det gængse danske navn) |
| MF | Saint Martin | Saint-Martin | Wikipedia (bindestreg er korrekt i det franske officielle navn) |
| MM | Myanmar (Burma) | Myanmar | CLDR (parentesen med Burma giver nyttig kontekst) |
| MO | SAR Macao | Macao | Wikipedia (Macao uden "SAR" er det gængse danske navn) |
| NL | Nederlandene | Kongeriget Nederlandene | CLDR (kort navn foretrækkes til app) |
| PM | Saint Pierre og Miquelon | Saint-Pierre og Miquelon | Wikipedia (bindestreg er korrekt i det franske officielle navn) |
| PS | De palæstinensiske områder | Palæstina | Wikipedia (Palæstina er mere direkte og gængs på dansk) |
| SH | St. Helena | Sankt Helena, Ascension og Tristan da Cunha | CLDR (kort navn foretrækkes til app) |
| SZ | Swaziland | Eswatini | Wikipedia (Eswatini er det officielle navn siden 2018) |
| TL | Timor-Leste | Østtimor | Wikipedia (Østtimor er det gængse danske navn) |
| VG | De Britiske Jomfruøer | Britiske Jomfruøer | CLDR (artiklen "De" er del af det officielle danske navn) |
| VI | De Amerikanske Jomfruøer | Amerikanske Jomfruøer | CLDR (artiklen "De" er del af det officielle danske navn) |

---

## ro — Rumano (17 divergencias)

| País | Actual (CLDR+overrides) | Wikipedia | Recomendación |
|------|------------------------|-----------|---------------|
| BM | Bermuda | Insulele Bermude | CLDR (Bermuda este forma scurtă uzuală în română) |
| CN | China | Republica Populară Chineză | CLDR (numele scurt este preferabil pentru app) |
| CV | Capul Verde | Republica Capului Verde | CLDR (numele scurt este preferabil pentru app) |
| FM | Micronezia | Statele Federate ale Microneziei | CLDR (numele scurt este preferabil pentru app) |
| GB | Regatul Unit | Regatul Unit al Marii Britanii și al Irlandei de Nord | CLDR (numele scurt este preferabil pentru app) |
| MF | Sfântul Martin | Saint-Martin | CLDR (Sfântul Martin este forma românească corectă) |
| MM | Myanmar (Birmania) | Myanmar | CLDR (paranteza cu Birmania oferă context util) |
| MP | Insulele Mariane de Nord | Comunitatea Insulelor Mariane de Nord | CLDR (numele scurt este preferabil pentru app) |
| NL | Țările de Jos | Regatul Țărilor de Jos | CLDR (numele scurt este preferabil pentru app) |
| PG | Papua-Noua Guinee | Papua Noua Guinee | Wikipedia (fără cratimă este forma mai uzuală în română) |
| PM | Saint-Pierre și Miquelon | Saint Pierre și Miquelon | CLDR (cratima este corectă în numele francez oficial) |
| PS | Palestina | Statul Palestina | CLDR (numele scurt este preferabil pentru app) |
| SH | Sfânta Elena | Sfânta Elena, Ascension și Tristan da Cunha | CLDR (numele scurt este preferabil pentru app) |
| SR | Suriname | Surinam | Wikipedia (Surinam este forma tradițională și mai uzuală în română) |
| SX | Sint-Maarten | Sint Maarten | CLDR (cratima respectă grafia oficială neerlandeză) [REF-B: Wikipedia — numele oficial al țării constituente este "Sint Maarten" fără cratimă; cratima din CLDR este incorectă. Guvernul și constituția folosesc "Sint Maarten"] |
| VA | Statul Cetății Vaticanului | Vatican | Wikipedia (Vatican este forma scurtă uzuală și mai naturală în română) |
| VC | Saint Vincent și Grenadinele | Sfântul Vincențiu și Grenadinele | Wikipedia (Sfântul Vincențiu este forma românească corectă a numelui) |

---

## sv — Sueco (10 divergencias)

| País | Actual (CLDR+overrides) | Wikipedia | Recomendación |
|------|------------------------|-----------|---------------|
| AE | Förenade Arabemiraten | Förenade arabemiraten | CLDR (versalt "A" i Arabemiraten är korrekt som egennamn) |
| BL | S:t Barthélemy | Saint-Barthélemy | CLDR (S:t är den svenska standardförkortningen för Saint) |
| FM | Mikronesien | Mikronesiska federationen | CLDR (kort namn föredras i appen) |
| KN | S:t Kitts och Nevis | Saint Kitts och Nevis | CLDR (S:t är den svenska standardförkortningen för Saint) |
| LC | S:t Lucia | Saint Lucia | CLDR (S:t är den svenska standardförkortningen för Saint) |
| MM | Myanmar (Burma) | Myanmar | CLDR (parentesen med Burma ger nyttig kontext) |
| NL | Nederländerna | Konungariket Nederländerna | CLDR (kort namn föredras i appen) |
| PM | S:t Pierre och Miquelon | Saint-Pierre och Miquelon | CLDR (S:t är den svenska standardförkortningen; konsekvent med övriga) |
| SH | S:t Helena | Sankta Helena, Ascension och Tristan da Cunha | CLDR (kort namn föredras i appen) |
| VC | S:t Vincent och Grenadinerna | Saint Vincent och Grenadinerna | CLDR (S:t är den svenska standardförkortningen; konsekvent med övriga) |

---
