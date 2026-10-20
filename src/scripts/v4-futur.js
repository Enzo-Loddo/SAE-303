// V4 · Quel écart en 2050 ?
// Recette de la cellule V4_interaction du notebook : aujourd'hui (cercle vide) → projection
// médiane (point rouge) à l'horizon choisi, avec la marge de 90 % des simulations.
import * as Plot from "@observablehq/plot";
import { ORDRE, moyenne, pente } from "./outils.js";

export const ANNEE_ACTUELLE = 2026;
const virgule = (x, n) => x.toFixed(n).replace(".", ",");

// Aujourd'hui : droite de tendance des écarts observés depuis 1970, prolongée jusqu'en 2026
export function ecartsAujourdhui(tmTerritoire, annee = ANNEE_ACTUELLE) {
  return ORDRE.map((t) => {
    const v = tmTerritoire.filter((d) => d.territoire === t);
    const mx = moyenne(v, (d) => d.annee);
    const my = moyenne(v, (d) => d.anomalie);
    return { territoire: t, ecart: my + pente(v) * (annee - mx) };
  });
}

// Textes qui suivent le bouton choisi : titre, sous-titre, territoires « en avance » sur les modèles
export function textesV4({ projections }, tmTerritoire, horizon) {
  const proj = projections.filter((d) => d.horizon === horizon);
  const auj = new Map(ecartsAujourdhui(tmTerritoire).map((d) => [d.territoire, d.ecart]));
  const f1 = (x) => "+" + virgule(x, 1);
  const q50 = proj.map((d) => d.q50);
  const [eMin, eMax] = [Math.min(...q50), Math.max(...q50)];
  const ecart = f1(eMin) === f1(eMax) ? f1(eMin) + " °C" : `${f1(eMin)} à ${f1(eMax)} °C`;
  return {
    titre: `En ${horizon}, il fera en moyenne ${ecart} de plus qu'en 1991-2020`,
    sousTitre: `Température moyenne annuelle aujourd'hui (${ANNEE_ACTUELLE}, estimée) et projetée à l'horizon ${horizon}, par territoire`,
    enAvance: proj.filter((d) => d.q50 < auj.get(d.territoire)).map((d) => d.territoire),
  };
}

export function projectionHorizon({ projections, reference }, tmTerritoire, horizon, { width = 640, ariaLabel, ariaDescription } = {}) {
  const proj = projections.filter((d) => d.horizon === horizon);
  const aujourdhui = ecartsAujourdhui(tmTerritoire);
  const ecartAujourdhui = new Map(aujourdhui.map((d) => [d.territoire, d.ecart]));
  const temp = (t, e) => virgule(reference[t] + e, 1) + " °C";
  const fmt = (x) => (x > 0 ? "+" : "") + virgule(x, 1) + " °C";
  const etroit = width < 500;
  return Plot.plot({
    width,
    height: 380,
    marginLeft: etroit ? 95 : 130,
    marginRight: 40,
    marginTop: 20,
    ariaLabel,
    ariaDescription,
    style: { background: "transparent" },
    // échelle fixe (toutes les projections) : les points avancent quand on change d'horizon
    x: { domain: [-0.2, Math.max(...projections.map((d) => d.q95)) + 0.1], label: "Écart à la moyenne 1991-2020 (°C) →", tickFormat: "+.1f", grid: true },
    y: { domain: ORDRE, label: null, padding: 0.4 },
    marks: [
      Plot.ruleX([0], { stroke: "#333" }),
      // la marge d'incertitude : 90 % des simulations tombent dans cette bande
      Plot.ruleY(proj, { y: "territoire", x1: "q05", x2: "q95", stroke: "#d6604d", strokeOpacity: 0.3, strokeWidth: 16 }),
      Plot.link(proj, { y: "territoire", x1: (d) => ecartAujourdhui.get(d.territoire), x2: "q50", stroke: "#999", strokeDasharray: "3,3", markerEnd: "arrow" }),
      Plot.dot(aujourdhui, {
        y: "territoire",
        x: "ecart",
        r: 7,
        fill: "white",
        stroke: "#333",
        strokeWidth: 2,
        tip: true,
        title: (d) => `${d.territoire} · aujourd'hui (${ANNEE_ACTUELLE}, estimé)\n≈ ${temp(d.territoire, d.ecart)} en moyenne sur l'année\n${fmt(d.ecart)} par rapport à 1991-2020`,
      }),
      Plot.text(aujourdhui, { y: "territoire", x: "ecart", text: (d) => `Aujourd'hui (${ANNEE_ACTUELLE})\n≈ ${temp(d.territoire, d.ecart)}`, dy: 30, fontSize: 11, fill: "#333" }),
      Plot.dot(proj, {
        y: "territoire",
        x: "q50",
        r: 8,
        fill: "#d6604d",
        tip: true,
        title: (d) =>
          `${d.territoire} · ${horizon} (niveau ${d.niveau})\n≈ ${temp(d.territoire, d.q50)} en moyenne sur l'année\nsoit ${fmt(d.q50 - ecartAujourdhui.get(d.territoire))} par rapport à aujourd'hui\nmarge : ${temp(d.territoire, d.q05)} à ${temp(d.territoire, d.q95)}`,
      }),
      Plot.text(proj, { y: "territoire", x: "q50", text: (d) => `En ${horizon}\n≈ ${temp(d.territoire, d.q50)}`, dy: -30, fontSize: 11, fontWeight: "bold", fill: "#b2182b" }),
    ],
  });
}
