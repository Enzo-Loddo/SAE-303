// Outils partagés par les 5 graphiques : ordre et couleurs des territoires,
// petits calculs (moyenne, pente…) et formats de nombres en français.
import { TERRITOIRES } from "../config/site.js";

// Noms des territoires tels qu'ils sont écrits dans les données
export const ORDRE = ["Martinique", "La Réunion", "Nouvelle-Calédonie"];

// Une couleur = un territoire : on reprend celles de src/config/site.js
const ID = { Martinique: "martinique", "La Réunion": "reunion", "Nouvelle-Calédonie": "caledonie" };
export const COULEURS = Object.fromEntries(ORDRE.map((t) => [t, TERRITOIRES.find((x) => x.id === ID[t]).couleur]));

export const somme = (v, f) => v.reduce((s, d) => s + f(d), 0);
export const moyenne = (v, f) => somme(v, f) / v.length;
export const etendue = (v, f) => [Math.min(...v.map(f)), Math.max(...v.map(f))];

// écart-type d'échantillon (comme d3.deviation)
export const ecartType = (v, f) => {
  const m = moyenne(v, f);
  return Math.sqrt(somme(v, (d) => (f(d) - m) ** 2) / (v.length - 1));
};

// pente de la droite de régression des écarts (anomalie) en fonction de l'année, en °C par an
export const pente = (v) => {
  const mx = moyenne(v, (d) => d.annee);
  const my = moyenne(v, (d) => d.anomalie);
  return somme(v, (d) => (d.annee - mx) * (d.anomalie - my)) / somme(v, (d) => (d.annee - mx) ** 2);
};

// +1,23 : signe, n décimales, virgule
export const signe = (x, n = 2) => (x > 0 ? "+" : "") + x.toFixed(n).replace(".", ",");

// Redessine un graphique quand la largeur de son conteneur change (téléphone ↔ ordinateur)
export function suivreLargeur(conteneur, dessiner) {
  let largeur = 0;
  const maj = () => {
    const l = Math.floor(conteneur.clientWidth);
    if (l > 0 && l !== largeur) {
      largeur = l;
      dessiner(l);
    }
  };
  maj();
  if ("ResizeObserver" in window) new ResizeObserver(maj).observe(conteneur);
  return () => dessiner(largeur || Math.floor(conteneur.clientWidth));
}
