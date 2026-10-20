// Prépare les données allégées des 5 graphiques (src/data/*.json) à partir des
// fichiers bruts de src/assets/, avec les MÊMES calculs que le notebook Observable
// (cellules config, mensuelPropre, annuel, annuelTM, anomalies, parTerritoire,
// tendancesStations, projectionsTMm, climatAnnuel).
// À relancer si les fichiers de src/assets/ changent :  node src/scripts/preparer-donnees.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as d3 from "d3";

const lire = (f) => JSON.parse(readFileSync(new URL(`../assets/${f}`, import.meta.url), "utf8"));
const ecrire = (f, donnees) => {
  mkdirSync(new URL("../data/", import.meta.url), { recursive: true });
  writeFileSync(new URL(`../data/${f}`, import.meta.url), JSON.stringify(donnees));
  console.log(`src/data/${f} : ${Array.isArray(donnees) ? donnees.length + " lignes" : "objet"}`);
};
const arrondi = (x, n = 3) => +x.toFixed(n);

const mensuel = lire("donnees_mensuelles_DOM.json");
const stations = lire("stations_DOM.json");
const projections = lire("projections_synthese_DOM.json");

// ── cellule config ──
const config = { anneeDebut: 1970, refDebut: 1991, refFin: 2020, minAnneesRef: 25, garderNonHomogene: true };

// ── cellule mensuelPropre ──
const mensuelPropre = mensuel
  .map((d) => ({ ...d, mois: +d.mois }))
  .filter((d) => d.annee >= config.anneeDebut && Number.isFinite(d.valeur) && (config.garderNonHomogene || d.q_hom === 1));

// ── cellule annuel : 12 mois obligatoires, cumul pour RR, moyenne pour TN et TX ──
const annuel = d3
  .flatRollup(
    mensuelPropre,
    (v) => (v.length === 12 ? (v[0].variable === "RR" ? d3.sum(v, (d) => d.valeur) : d3.mean(v, (d) => d.valeur)) : null),
    (d) => d.territoire,
    (d) => d.variable,
    (d) => d.num_poste,
    (d) => d.annee,
  )
  .map(([territoire, variable, num_poste, annee, valeur]) => ({ territoire, variable, num_poste, annee, valeur }))
  .filter((d) => d.valeur !== null);

// ── cellule annuelTM : (TN + TX) / 2, jointure station-année ──
const cle = (d) => `${d.num_poste}-${d.annee}`;
const tnParCle = new Map(annuel.filter((d) => d.variable === "TN").map((d) => [cle(d), d.valeur]));
const annuelTM = annuel
  .filter((d) => d.variable === "TX" && tnParCle.has(cle(d)))
  .map((d) => ({ territoire: d.territoire, num_poste: d.num_poste, annee: d.annee, valeur: (d.valeur + tnParCle.get(cle(d))) / 2 }));

// ── cellule anomalies : écart à la moyenne 1991-2020 de chaque station ──
const anomalies = (lignes, { relatif = false } = {}) => {
  const ref = new Map(
    d3
      .rollups(
        lignes.filter((d) => d.annee >= config.refDebut && d.annee <= config.refFin),
        (v) => (v.length >= config.minAnneesRef ? d3.mean(v, (d) => d.valeur) : null),
        (d) => d.num_poste,
      )
      .filter(([, m]) => m !== null),
  );
  return lignes
    .filter((d) => ref.has(d.num_poste))
    .map((d) => ({ ...d, anomalie: relatif ? 100 * (d.valeur / ref.get(d.num_poste) - 1) : d.valeur - ref.get(d.num_poste) }));
};
const anomaliesTM = anomalies(annuelTM);
const anomaliesRR = anomalies(annuel.filter((d) => d.variable === "RR"), { relatif: true });

// ── cellule parTerritoire ──
const parTerritoire = (lignes, resume = d3.mean) =>
  d3
    .flatRollup(lignes, (v) => ({ anomalie: resume(v, (d) => d.anomalie), nbStations: v.length }), (d) => d.territoire, (d) => d.annee)
    .map(([territoire, annee, o]) => ({ territoire, annee, ...o }))
    .sort((a, b) => d3.ascending(a.territoire, b.territoire) || a.annee - b.annee);

const tmTerritoire = parTerritoire(anomaliesTM);
const rrTerritoire = parTerritoire(anomaliesRR, d3.median);

// V1, V3, V4 : écart annuel en °C par territoire (même contenu que la cellule donneesAstro)
ecrire(
  "tm-territoire.json",
  tmTerritoire.map(({ territoire, annee, anomalie, nbStations }) => ({ territoire, annee, anomalie: arrondi(anomalie), nbStations })),
);

// ── V2 · cellule tendancesStations : pente des écarts annuels, au moins 30 ans ──
const pente = (v) => {
  const mx = d3.mean(v, (d) => d.annee);
  const my = d3.mean(v, (d) => d.anomalie);
  return d3.sum(v, (d) => (d.annee - mx) * (d.anomalie - my)) / d3.sum(v, (d) => (d.annee - mx) ** 2);
};
const coord = new Map(stations.filter((d) => d.variable === "TX").map((d) => [d.num_poste, d]));
const tendancesStations = d3
  .groups(anomaliesTM, (d) => d.num_poste)
  .filter(([, v]) => v.length >= 30)
  .map(([num_poste, v]) => {
    const s = coord.get(num_poste);
    return {
      num_poste,
      territoire: v[0].territoire,
      nom: s?.nom,
      latitude: s?.latitude,
      longitude: s?.longitude,
      altitude_m: s?.altitude_m,
      debut: d3.min(v, (d) => d.annee),
      fin: d3.max(v, (d) => d.annee),
      nbAnnees: v.length,
      tendance: arrondi(10 * pente(v), 4),
    };
  });
ecrire("tendances-stations.json", tendancesStations);

// ── V4 · cellule projectionsTMm (+ température moyenne 1991-2020 du niveau « hist ») ──
const horizons = ["2030", "2050", "2100"];
const lignesProj = d3
  .flatRollup(
    projections.filter((d) => d.indicateur === "TMm" && d.type_ecart === "abs" && d.niveau !== "hist"),
    (v) => Object.fromEntries(v.map((d) => [d.statistique, d.valeur_moyenne_spatiale])),
    (d) => d.territoire,
    (d) => d.niveau,
  )
  .map(([territoire, niveau, s]) => ({ territoire, niveau, q05: s.q05, q50: s.q50, q95: s.q95 }));
const projectionsTMm = d3
  .groups(lignesProj, (d) => d.territoire)
  .flatMap(([, v]) => v.sort((a, b) => a.q50 - b.q50).map((d, i) => ({ ...d, horizon: horizons[i] })));
const reference = Object.fromEntries(
  projections
    .filter((d) => d.indicateur === "TMm" && d.niveau === "hist" && d.type_ecart === "abs" && d.statistique === "q50")
    .map((d) => [d.territoire, d.valeur_moyenne_spatiale]),
);
ecrire("projections-tmm.json", { projections: projectionsTMm, reference });

// ── V5 · cellule climatAnnuel : chaleur (°C) et pluie (%) par territoire et par année ──
const pluie = new Map(rrTerritoire.map((d) => [`${d.territoire}-${d.annee}`, d.anomalie]));
const climatAnnuel = tmTerritoire
  .filter((d) => pluie.has(`${d.territoire}-${d.annee}`))
  .map((d) => ({ territoire: d.territoire, annee: d.annee, chaleur: arrondi(d.anomalie), pluie: arrondi(pluie.get(`${d.territoire}-${d.annee}`), 2) }));
ecrire("climat-annuel.json", climatAnnuel);
