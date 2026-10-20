// V3 · Quel territoire se réchauffe le plus vite depuis 1970 ?
// Recette courbesAnomalies du notebook (section 6) + titre calculé de la cellule V3_evolution.
import * as Plot from "@observablehq/plot";
import { COULEURS, pente, signe } from "./outils.js";

// Tendance de chaque territoire : °C par décennie et hausse totale sur la période, du plus rapide au plus lent
export function tendancesTerritoires(donnees) {
  return [...new Set(donnees.map((d) => d.territoire))]
    .map((t) => {
      const v = donnees.filter((d) => d.territoire === t);
      const p = pente(v);
      const annees = v.map((d) => d.annee);
      return { territoire: t, parDecennie: 10 * p, total: p * (Math.max(...annees) - Math.min(...annees)) };
    })
    .sort((a, b) => b.parDecennie - a.parDecennie);
}

// Titre porteur : il change selon le territoire choisi dans le menu
export function titreV3(tendances) {
  const premier = tendances[0];
  return tendances.length > 1
    ? `${premier.territoire === "La Réunion" ? "La Réunion" : "La " + premier.territoire} se réchauffe le plus vite depuis 1970`
    : `${premier.territoire} : ${signe(premier.parDecennie)} °C par décennie depuis 1970`;
}

// Courbes d'anomalies lissées (moyenne glissante centrée), une par territoire
export function courbesAnomalies(donnees, { width = 640, height = 380, lissage = 10, couleurs = COULEURS, ariaLabel, ariaDescription } = {}) {
  const lignes = [...donnees].sort((a, b) => a.annee - b.annee);
  const territoires = [...new Set(lignes.map((d) => d.territoire))];
  const avant = Math.floor(lissage / 2);
  const tendances = territoires.flatMap((t) => {
    const serie = lignes.filter((d) => d.territoire === t);
    return serie.map((d, i) => {
      const fenetre = serie.slice(Math.max(0, i - avant), i - avant + lissage);
      const tendance = fenetre.reduce((s, x) => s + x.anomalie, 0) / fenetre.length;
      return { ...d, tendance };
    });
  });
  return Plot.plot({
    width,
    height,
    marginLeft: 50,
    marginRight: 20,
    ariaLabel,
    ariaDescription,
    style: { background: "transparent" },
    x: { label: null, tickFormat: "d" },
    y: { label: `Écart à la moyenne 1991-2020 (°C, moyenne glissante sur ${lissage} ans)`, grid: true, tickFormat: "+.1f" },
    color: { domain: territoires, range: territoires.map((t) => couleurs[t] ?? "#888"), legend: true },
    marks: [
      Plot.ruleY([0]),
      Plot.line(tendances, { x: "annee", y: "tendance", stroke: "territoire", strokeWidth: 2.5 }),
      Plot.tip(
        tendances,
        Plot.pointer({
          x: "annee",
          y: "tendance",
          stroke: "territoire",
          title: (d) => `${d.territoire} · ${d.annee}\nTendance : ${signe(d.tendance)} °C\nAnnée seule : ${signe(d.anomalie)} °C · ${d.nbStations} stations`,
        }),
      ),
    ],
  });
}
