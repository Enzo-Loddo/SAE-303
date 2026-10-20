// V1 · Les années les plus chaudes sont-elles toutes récentes ?
// Recette de la cellule V1_distribution du notebook : strip plot en essaim,
// un point par année et par territoire, contour noir = années les plus chaudes.
import * as Plot from "@observablehq/plot";
import { ORDRE, etendue, signe } from "./outils.js";

const fmt = (x) => signe(x) + " °C";

// Ce que les filtres sélectionnent : données, nombre d'années « les plus chaudes », résumé par territoire
export function selectionV1(tmTerritoire, { territoires = ORDRE, debut, fin }) {
  const [d, f] = [Math.min(debut, fin), Math.max(debut, fin)];
  const choisis = ORDRE.filter((t) => territoires.includes(t));
  const donnees = tmTerritoire.filter((x) => choisis.includes(x.territoire) && x.annee >= d && x.annee <= f);
  const nTop = Math.max(1, Math.min(10, Math.floor((f - d + 1) / 3)));
  const top = new Set();
  const resume = choisis.map((t) => {
    const v = donnees.filter((x) => x.territoire === t).sort((a, b) => b.anomalie - a.anomalie);
    v.slice(0, nTop).forEach((x) => top.add(x));
    return {
      territoire: t,
      texte: `les ${nTop} années les plus chaudes datent toutes de ${Math.min(...v.slice(0, nTop).map((x) => x.annee))} ou après ; record en ${v[0].annee} (${fmt(v[0].anomalie)}).`,
    };
  });
  return {
    debut: d,
    fin: f,
    territoires: choisis,
    donnees,
    nTop,
    top,
    resume,
    sousTitre: `Écart de chaque année à la moyenne 1991-2020, en °C · ${choisis.join(", ")} · ${d}-${f}`,
  };
}

// Dessin : les échelles restent fixes (calculées sur toutes les données) quand on filtre
export function distributionAnnees(tmTerritoire, selection, { width = 640, ariaLabel, ariaDescription } = {}) {
  const { donnees, territoires, top, nTop } = selection;
  return Plot.plot({
    width,
    height: 70 + 150 * territoires.length,
    marginLeft: width < 500 ? 90 : 130,
    marginRight: 20,
    ariaLabel,
    ariaDescription,
    style: { background: "transparent" },
    x: { domain: etendue(tmTerritoire, (d) => d.anomalie), nice: true, label: "Écart de l'année à la moyenne 1991-2020 (°C) →", tickFormat: "+.1f", grid: true },
    fy: { domain: territoires, label: null, axis: "left" },
    color: { type: "linear", domain: etendue(tmTerritoire, (d) => d.annee), range: ["#fee0d2", "#67000d"], legend: true, label: "Année", tickFormat: "d" },
    marks: [
      Plot.ruleX([0], { stroke: "#333" }),
      Plot.dot(
        donnees,
        Plot.dodgeY("middle", {
          x: "anomalie",
          fy: "territoire",
          r: width < 500 ? 4 : 6,
          fill: "annee",
          stroke: (d) => (top.has(d) ? "#000" : "#999"),
          strokeWidth: (d) => (top.has(d) ? 1.8 : 0.4),
          tip: true,
          title: (d) => `${d.territoire} · ${d.annee}\n${fmt(d.anomalie)} par rapport à 1991-2020${top.has(d) ? `\nparmi les ${nTop} années les plus chaudes` : ""}`,
        }),
      ),
    ],
  });
}
