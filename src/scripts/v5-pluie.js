// V5 · La pluie suit-elle la chaleur ?
// Recette de la cellule V5_pluieChaleur du notebook : small multiples, un graphique par
// territoire, chaleur et pluie sur le même axe en écarts-types à la normale 1991-2020.
import * as Plot from "@observablehq/plot";
import { ORDRE, ecartType, moyenne } from "./outils.js";

const fmtC = (x) => (x > 0 ? "+" : "") + x.toFixed(2).replace(".", ",") + " °C";
const fmtP = (x) => (x > 0 ? "+" : "") + Math.round(x) + " %";

// Moyenne glissante sur 10 ans, puis division par l'écart-type des années 1991-2020 du territoire
export function indicesPluieChaleur(climatAnnuel) {
  return ORDRE.flatMap((t) => {
    const v = climatAnnuel.filter((d) => d.territoire === t).sort((a, b) => a.annee - b.annee);
    const ref = v.filter((d) => d.annee >= 1991 && d.annee <= 2020);
    const sdC = ecartType(ref, (d) => d.chaleur); // variation habituelle d'une année à l'autre
    const sdP = ecartType(ref, (d) => d.pluie);
    return v.flatMap((d, i) => {
      const f = v.slice(Math.max(0, i - 5), i + 5); // moyenne glissante centrée sur 10 ans
      const chaleur = moyenne(f, (x) => x.chaleur);
      const pluie = moyenne(f, (x) => x.pluie);
      return [
        { territoire: t, annee: d.annee, serie: "Chaleur", indice: chaleur / sdC, texte: fmtC(chaleur) },
        { territoire: t, annee: d.annee, serie: "Pluie", indice: pluie / sdP, texte: fmtP(pluie) },
      ];
    });
  });
}

export function pluieChaleur(climatAnnuel, { width = 640, ariaLabel, ariaDescription } = {}) {
  const lignes = indicesPluieChaleur(climatAnnuel);
  // sur un écran étroit, les trois graphiques sont empilés au lieu d'être côte à côte
  const empile = width < 640;
  const facette = empile ? "fy" : "fx";
  return Plot.plot({
    width,
    height: empile ? 3 * 230 : 340,
    marginLeft: 50,
    marginTop: 45,
    marginRight: empile ? 20 : undefined,
    ariaLabel,
    ariaDescription,
    style: { background: "transparent" },
    // empilés : pas d'axe fy sur le côté (trop étroit), le nom est écrit en haut de chaque graphique
    [facette]: { domain: ORDRE, label: null, padding: empile ? 0.15 : 0.1, ...(empile ? { axis: null } : {}) },
    x: { label: null, tickFormat: "d", ticks: 4 },
    y: { label: "↑ Écart à la normale 1991-2020 (en écarts-types)", grid: true, tickFormat: "+.1f" },
    color: { domain: ["Chaleur", "Pluie"], range: ["#d6604d", "#2166ac"], legend: true },
    marks: [
      Plot.frame({ stroke: "#ddd" }),
      Plot.ruleY([0], { stroke: "#333" }),
      ...(empile ? [Plot.text(ORDRE, { fy: (d) => d, text: (d) => d, frameAnchor: "top-left", dx: 6, dy: 6, fontWeight: "bold" })] : []),
      Plot.line(lignes, { x: "annee", y: "indice", [facette]: "territoire", stroke: "serie", strokeWidth: 2.5 }),
      Plot.tip(
        lignes,
        Plot.pointerX({
          x: "annee",
          y: "indice",
          [facette]: "territoire",
          stroke: "serie",
          title: (d) => `${d.territoire} · ${d.annee}\n${d.serie} : ${d.texte} (moyenne sur 10 ans)`,
        }),
      ),
    ],
  });
}
