// Prépare les fichiers de données LÉGERS utilisés par le site, en reprenant
// exactement les calculs du notebook Observable (même nettoyage, mêmes jointures).
// Usage :  node scripts/preparer-donnees.mjs
// Entrée  : data-source/donnees_mensuelles_DOM.json (gros fichier, hors dépôt)
//           src/assets/stations_DOM.json, src/assets/projections_synthese_DOM.json
// Sortie  : src/data/*.json  (2 décimales, seulement les colonnes utiles)
import * as d3 from "d3";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const lire = (p) => JSON.parse(readFileSync(p, "utf-8"));
const brut = ["data-source/donnees_mensuelles_DOM.json", "src/assets/donnees_mensuelles_DOM.json"].find(existsSync);
if (!brut) throw new Error("donnees_mensuelles_DOM.json introuvable (voir data-source/LISEZMOI.md)");
const mensuel = lire(brut);
const stations = lire("src/assets/stations_DOM.json");
const projections = lire("src/assets/projections_synthese_DOM.json");
const config = { anneeDebut: 1970, refDebut: 1991, refFin: 2020, minAnneesRef: 25, garderNonHomogene: true };

// ── Nettoyage (cellule mensuelPropre du notebook)
const mensuelPropre = mensuel
  .map((d) => ({ ...d, mois: +d.mois }))
  .filter((d) => d.annee >= config.anneeDebut && Number.isFinite(d.valeur) && (config.garderNonHomogene || d.q_hom === 1));

// ── Années complètes (12 mois) : moyenne pour TN/TX, somme pour RR (cellule annuel)
const annuel = d3
  .flatRollup(
    mensuelPropre,
    (v) => (v.length === 12 ? (v[0].variable === "RR" ? d3.sum(v, (d) => d.valeur) : d3.mean(v, (d) => d.valeur)) : null),
    (d) => d.territoire, (d) => d.variable, (d) => d.num_poste, (d) => d.annee,
  )
  .map(([territoire, variable, num_poste, annee, valeur]) => ({ territoire, variable, num_poste, annee, valeur }))
  .filter((d) => d.valeur !== null);

// ── Jointure TX + TN (cellule annuelTM)
const cle = (d) => `${d.num_poste}-${d.annee}`;
const tnParCle = new Map(annuel.filter((d) => d.variable === "TN").map((d) => [cle(d), d.valeur]));
const annuelTM = annuel
  .filter((d) => d.variable === "TX" && tnParCle.has(cle(d)))
  .map((d) => ({ territoire: d.territoire, num_poste: d.num_poste, annee: d.annee, valeur: (d.valeur + tnParCle.get(cle(d))) / 2 }));

// ── Anomalies par rapport à 1991-2020 de chaque station (cellule anomalies)
const anomalies = (lignes, { relatif = false } = {}) => {
  const ref = new Map(
    d3.rollups(
      lignes.filter((d) => d.annee >= config.refDebut && d.annee <= config.refFin),
      (v) => (v.length >= config.minAnneesRef ? d3.mean(v, (d) => d.valeur) : null),
      (d) => d.num_poste,
    ).filter(([, m]) => m !== null),
  );
  return lignes.filter((d) => ref.has(d.num_poste)).map((d) => ({
    ...d,
    anomalie: relatif ? 100 * (d.valeur / ref.get(d.num_poste) - 1) : d.valeur - ref.get(d.num_poste),
  }));
};
const anomaliesTM = anomalies(annuelTM);
const anomaliesRR = anomalies(annuel.filter((d) => d.variable === "RR"), { relatif: true });

const parTerritoire = (lignes, resume = d3.mean) =>
  d3.flatRollup(lignes, (v) => ({ anomalie: resume(v, (d) => d.anomalie), nbStations: v.length }), (d) => d.territoire, (d) => d.annee)
    .map(([territoire, annee, o]) => ({ territoire, annee, ...o }))
    .sort((a, b) => d3.ascending(a.territoire, b.territoire) || a.annee - b.annee);
const tmTerritoire = parTerritoire(anomaliesTM);
const rrTerritoire = parTerritoire(anomaliesRR, d3.median);

// ── Tendance de chaque station, en °C par décennie (cellule tendancesStations)
const pente = (v) => {
  const mx = d3.mean(v, (d) => d.annee), my = d3.mean(v, (d) => d.anomalie);
  return d3.sum(v, (d) => (d.annee - mx) * (d.anomalie - my)) / d3.sum(v, (d) => (d.annee - mx) ** 2);
};
const coord = new Map(stations.filter((d) => d.variable === "TX").map((d) => [d.num_poste, d]));
const tendancesStations = d3.groups(anomaliesTM, (d) => d.num_poste)
  .filter(([, v]) => v.length >= 30)
  .map(([num_poste, v]) => {
    const s = coord.get(num_poste);
    return { num_poste, territoire: v[0].territoire, nom: s?.nom, latitude: s?.latitude, longitude: s?.longitude, altitude_m: s?.altitude_m,
      debut: d3.min(v, (d) => d.annee), fin: d3.max(v, (d) => d.annee), nbAnnees: v.length, tendance: 10 * pente(v) };
  });

// ── Projections de température moyenne (cellule projectionsTMm) + référence 1991-2020 (niveau hist)
const horizons = ["2030", "2050", "2100"];
const lignes = d3.flatRollup(
  projections.filter((d) => d.indicateur === "TMm" && d.type_ecart === "abs" && d.niveau !== "hist"),
  (v) => Object.fromEntries(v.map((d) => [d.statistique, d.valeur_moyenne_spatiale])),
  (d) => d.territoire, (d) => d.niveau,
).map(([territoire, niveau, s]) => ({ territoire, niveau, ...s }));
const projectionsTMm = d3.groups(lignes, (d) => d.territoire).flatMap(([, v]) =>
  v.sort((a, b) => a.q50 - b.q50).map((d, i) => ({ territoire: d.territoire, niveau: d.niveau, horizon: horizons[i], q05: d.q05, q50: d.q50, q95: d.q95 })));
const reference = Object.fromEntries(
  projections.filter((d) => d.indicateur === "TMm" && d.niveau === "hist" && d.type_ecart === "abs" && d.statistique === "q50")
    .map((d) => [d.territoire, d.valeur_moyenne_spatiale]));

// ── Écriture : 2 décimales
const r = (x, n = 2) => (x == null ? x : +x.toFixed(n));
mkdirSync("src/data", { recursive: true });
const ecrire = (nom, data) => { writeFileSync(`src/data/${nom}`, JSON.stringify(data)); console.log(nom, Array.isArray(data) ? data.length + " lignes" : "ok"); };
ecrire("anomalies-temperature.json", tmTerritoire.map((d) => ({ ...d, anomalie: r(d.anomalie) })));
ecrire("anomalies-pluie.json", rrTerritoire.map((d) => ({ ...d, anomalie: r(d.anomalie, 1) })));
ecrire("tendances-stations.json", tendancesStations.map((d) => ({ ...d, tendance: r(d.tendance, 3) })));
ecrire("projections-tmm.json", { projections: projectionsTMm.map((d) => ({ ...d, q05: r(d.q05), q50: r(d.q50), q95: r(d.q95) })), reference: Object.fromEntries(Object.entries(reference).map(([k, v]) => [k, r(v, 2)])) });
