import * as Plot from "@observablehq/plot";
import * as d3 from "d3";

export const TERRITOIRES = ["Martinique", "La Réunion", "Nouvelle-Calédonie"];
export const COULEURS = { "Martinique": "#0072B2", "La Réunion": "#D55E00", "Nouvelle-Calédonie": "#009E73" };
const ROUGE = "#d6604d";
const BLEU = "#2166ac";

const virgule = (s) => s.replace(".", ",");
export const signe = (x, n = 2) => (x > 0 ? "+" : "") + virgule(x.toFixed(n));
export const fmtC = (x, n = 2) => `${signe(x, n)} °C`;
export const fmtP = (x) => (x > 0 ? "+" : "") + Math.round(x) + " %";

export const pente = (v) => {
  const mx = d3.mean(v, (d) => d.annee), my = d3.mean(v, (d) => d.anomalie);
  return d3.sum(v, (d) => (d.annee - mx) * (d.anomalie - my)) / d3.sum(v, (d) => (d.annee - mx) ** 2);
};

export function animer(element) {
  if (!document.documentElement.classList.contains("js")) return element;
  element.querySelectorAll('[aria-label="line"] path').forEach((p) => {
    p.setAttribute("pathLength", "1");
    p.classList.add("trace");
  });
  element.querySelectorAll('[aria-label="dot"] circle').forEach((c, i) => {
    c.classList.add("pop");
    c.style.animationDelay = `${Math.min(i * 7, 1100)}ms`;
  });
  return element;
}

export function graphiqueDistribution(tm, { width = 720, territoires = TERRITOIRES, debut, fin } = {}) {
  const [a0, a1] = d3.extent(tm, (d) => d.annee);
  debut = Math.min(debut ?? a0, fin ?? a1);
  fin = Math.max(debut, fin ?? a1);
  const choix = TERRITOIRES.filter((t) => territoires.includes(t));
  const donnees = tm.filter((d) => choix.includes(d.territoire) && d.annee >= debut && d.annee <= fin);
  const nTop = Math.max(1, Math.min(10, Math.floor((fin - debut + 1) / 3)));
  const top = new Set();
  const resume = choix.map((t) => {
    const v = donnees.filter((d) => d.territoire === t).sort((a, b) => b.anomalie - a.anomalie);
    v.slice(0, nTop).forEach((d) => top.add(d));
    return { t, depuis: d3.min(v.slice(0, nTop), (d) => d.annee), record: v[0] };
  });
  const domaineAnnees = d3.extent(tm, (d) => d.annee);
  const couleur = { type: "linear", domain: domaineAnnees, range: ["#fee0d2", "#67000d"], label: "Année", tickFormat: "d" };
  const plot = Plot.plot({
    width,
    height: 70 + 150 * Math.max(1, choix.length),
    marginLeft: width < 560 ? 90 : 130,
    marginRight: 20,
    x: { domain: d3.extent(tm, (d) => d.anomalie), nice: true, label: "Écart de l'année à la moyenne 1991-2020 (°C) →", tickFormat: "+.1f", grid: true },
    fy: { domain: choix, label: null, axis: "left" },
    color: couleur,
    marks: [
      Plot.ruleX([0], { stroke: "#333" }),
      Plot.dot(donnees, Plot.dodgeY("middle", {
        x: "anomalie", fy: "territoire", r: 6, fill: "annee",
        stroke: (d) => (top.has(d) ? "#000" : "#999"),
        strokeWidth: (d) => (top.has(d) ? 1.8 : 0.4),
        tip: true,
        title: (d) => `${d.territoire} · ${d.annee}\n${fmtC(d.anomalie)} par rapport à 1991-2020${top.has(d) ? `\nparmi les ${nTop} années les plus chaudes` : ""}`,
      })),
    ],
  });
  const legende = Plot.legend({ color: couleur, width: 280 });
  return { plot: animer(plot), legende, resume, nTop, debut, fin };
}

export function courbesAnomalies(donnees, { width = 640, height = 380, lissage = 10, couleurs = COULEURS } = {}) {
  const lignes = [...donnees].sort((a, b) => a.annee - b.annee);
  const territoires = [...new Set(lignes.map((d) => d.territoire))];
  const avant = Math.floor(lissage / 2);
  const tendances = territoires.flatMap((t) => {
    const serie = lignes.filter((d) => d.territoire === t);
    return serie.map((d, i) => {
      const fenetre = serie.slice(Math.max(0, i - avant), i - avant + lissage);
      return { ...d, tendance: fenetre.reduce((s, x) => s + x.anomalie, 0) / fenetre.length };
    });
  });
  const couleur = { domain: territoires, range: territoires.map((t) => couleurs[t] ?? "#888") };
  const plot = Plot.plot({
    width, height, marginLeft: 56, marginRight: 20,
    x: { label: null, tickFormat: "d" },
    y: { label: `↑ Écart à la moyenne 1991-2020 (°C, moyenne glissante sur ${lissage} ans)`, grid: true, tickFormat: "+.1f" },
    color: couleur,
    marks: [
      Plot.ruleY([0]),
      Plot.line(tendances, { x: "annee", y: "tendance", stroke: "territoire", strokeWidth: 2.5 }),
      Plot.tip(tendances, Plot.pointer({
        x: "annee", y: "tendance", stroke: "territoire",
        title: (d) => `${d.territoire} · ${d.annee}\nTendance : ${signe(d.tendance)} °C\nAnnée seule : ${signe(d.anomalie)} °C · ${d.nbStations} stations`,
      })),
    ],
  });
  return { plot: animer(plot), legende: Plot.legend({ color: couleur, width: 360 }) };
}

export function tendancesTerritoires(donnees) {
  return d3.groups(donnees, (d) => d.territoire).map(([t, v]) => {
    const p = pente(v);
    return { t, parDecennie: 10 * p, total: p * (d3.max(v, (d) => d.annee) - d3.min(v, (d) => d.annee)) };
  }).sort((a, b) => b.parDecennie - a.parDecennie);
}

export function graphiquePrevisions({ projections, reference }, tm, { width = 720, horizon = "2050", anneeActuelle = 2026 } = {}) {
  const proj = projections.filter((d) => d.horizon === horizon);
  const aujourdhui = TERRITOIRES.map((t) => {
    const v = tm.filter((d) => d.territoire === t);
    const mx = d3.mean(v, (d) => d.annee), my = d3.mean(v, (d) => d.anomalie);
    return { territoire: t, ecart: my + pente(v) * (anneeActuelle - mx) };
  });
  const ecartAujourdhui = new Map(aujourdhui.map((d) => [d.territoire, d.ecart]));
  const temp = (t, e) => virgule((reference[t] + e).toFixed(1)) + " °C";
  const fmt = (x) => (x > 0 ? "+" : "") + virgule(x.toFixed(1)) + " °C";
  const plot = Plot.plot({
    width, height: 380, marginLeft: width < 560 ? 90 : 130, marginRight: 40, marginTop: 20,
    x: { domain: [-0.2, d3.max(projections, (d) => d.q95) + 0.1], label: "Écart à la moyenne 1991-2020 (°C) →", tickFormat: "+.1f", grid: true },
    y: { domain: TERRITOIRES, label: null, padding: 0.4 },
    marks: [
      Plot.ruleX([0], { stroke: "#333" }),
      Plot.ruleY(proj, { y: "territoire", x1: "q05", x2: "q95", stroke: ROUGE, strokeOpacity: 0.3, strokeWidth: 16 }),
      Plot.link(proj, { y: "territoire", x1: (d) => ecartAujourdhui.get(d.territoire), x2: "q50", stroke: "#999", strokeDasharray: "3,3", markerEnd: "arrow" }),
      Plot.dot(aujourdhui, { y: "territoire", x: "ecart", r: 7, fill: "white", stroke: "#333", strokeWidth: 2, tip: true,
        title: (d) => `${d.territoire} · aujourd'hui (${anneeActuelle}, estimé)\n≈ ${temp(d.territoire, d.ecart)} en moyenne sur l'année\n${fmt(d.ecart)} par rapport à 1991-2020` }),
      Plot.text(aujourdhui, { y: "territoire", x: "ecart", text: (d) => `Aujourd'hui (${anneeActuelle})\n≈ ${temp(d.territoire, d.ecart)}`, dy: 30, fontSize: 11, fill: "#333" }),
      Plot.dot(proj, { y: "territoire", x: "q50", r: 8, fill: ROUGE, tip: true,
        title: (d) => `${d.territoire} · ${horizon} (niveau ${d.niveau})\n≈ ${temp(d.territoire, d.q50)} en moyenne sur l'année\nsoit ${fmt(d.q50 - ecartAujourdhui.get(d.territoire))} par rapport à aujourd'hui\nmarge : ${temp(d.territoire, d.q05)} à ${temp(d.territoire, d.q95)}` }),
      Plot.text(proj, { y: "territoire", x: "q50", text: (d) => `En ${horizon}\n≈ ${temp(d.territoire, d.q50)}`, dy: -30, fontSize: 11, fontWeight: "bold", fill: "#b2182b" }),
    ],
  });
  const fmt1 = (x) => "+" + virgule(x.toFixed(1));
  const [eMin, eMax] = d3.extent(proj, (d) => d.q50);
  const titreEcart = fmt1(eMin) === fmt1(eMax) ? fmt1(eMin) + " °C" : `${fmt1(eMin)} à ${fmt1(eMax)} °C`;
  const enAvance = proj.filter((d) => d.q50 < ecartAujourdhui.get(d.territoire)).map((d) => d.territoire);
  return { plot: animer(plot), titreEcart, enAvance, anneeActuelle };
}

export function graphiquePluieChaleur(tm, rr, { width = 900 } = {}) {
  const pluie = new Map(rr.map((d) => [`${d.territoire}-${d.annee}`, d.anomalie]));
  const climat = tm.filter((d) => pluie.has(`${d.territoire}-${d.annee}`))
    .map((d) => ({ territoire: d.territoire, annee: d.annee, chaleur: d.anomalie, pluie: pluie.get(`${d.territoire}-${d.annee}`) }));
  const lignes = TERRITOIRES.flatMap((t) => {
    const v = climat.filter((d) => d.territoire === t).sort((a, b) => a.annee - b.annee);
    const ref = v.filter((d) => d.annee >= 1991 && d.annee <= 2020);
    const sdC = d3.deviation(ref, (d) => d.chaleur);
    const sdP = d3.deviation(ref, (d) => d.pluie);
    return v.flatMap((d, i) => {
      const f = v.slice(Math.max(0, i - 5), i + 5);
      const chaleur = d3.mean(f, (x) => x.chaleur), p = d3.mean(f, (x) => x.pluie);
      return [
        { territoire: t, annee: d.annee, serie: "Chaleur", indice: chaleur / sdC, texte: fmtC(chaleur) },
        { territoire: t, annee: d.annee, serie: "Pluie", indice: p / sdP, texte: fmtP(p) },
      ];
    });
  });
  const couleur = { domain: ["Chaleur", "Pluie"], range: [ROUGE, BLEU] };
  const plot = Plot.plot({
    width, height: 340, marginLeft: 50, marginTop: 45,
    fx: { domain: TERRITOIRES, label: null, padding: 0.1 },
    x: { label: null, tickFormat: "d", ticks: 4 },
    y: { label: "↑ Écart à la normale 1991-2020 (en écarts-types)", grid: true, tickFormat: "+.1f" },
    color: couleur,
    marks: [
      Plot.frame({ stroke: "#ddd" }),
      Plot.ruleY([0], { stroke: "#333" }),
      Plot.line(lignes, { x: "annee", y: "indice", fx: "territoire", stroke: "serie", strokeWidth: 2.5 }),
      Plot.tip(lignes, Plot.pointerX({
        x: "annee", y: "indice", fx: "territoire", stroke: "serie",
        title: (d) => `${d.territoire} · ${d.annee}\n${d.serie} : ${d.texte} (moyenne sur 10 ans)`,
      })),
    ],
  });
  return { plot: animer(plot), legende: Plot.legend({ color: couleur, width: 240 }) };
}
