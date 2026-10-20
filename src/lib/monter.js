// Petits utilitaires pour les graphiques dessinés dans le navigateur.

// Exécute `fn` quand l'élément approche de l'écran (le graphique se dessine à ce moment-là,
// donc son animation est vue par le lecteur).
export function auVisible(el, fn) {
  if (!("IntersectionObserver" in window)) return fn();
  const obs = new IntersectionObserver((entrees) => {
    if (entrees.some((e) => e.isIntersecting)) {
      obs.disconnect();
      fn();
    }
  }, { rootMargin: "150px" });
  obs.observe(el);
}

// Largeur à utiliser pour dessiner dans `el` (avec un minimum, au-delà : défilement horizontal).
export const largeurDe = (el, min = 320) => Math.max(min, Math.floor(el.clientWidth));

// Redessine quand la largeur change (rotation du téléphone, redimensionnement).
export function surLargeur(el, fn) {
  if (!("ResizeObserver" in window)) return;
  let derniere = el.clientWidth, t;
  new ResizeObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (Math.abs(el.clientWidth - derniere) > 12) { derniere = el.clientWidth; fn(); }
    }, 200);
  }).observe(el);
}

// Remplace le contenu de la zone du graphique
// Les animations de tracé ne se jouent qu'une fois : après la première apparition,
// le cadre reçoit data-joue et les redessins (filtres, survol) n'animent plus.
export function afficher(zone, ...elements) {
  zone.replaceChildren(...elements);
  const cadre = zone.closest("figure");
  if (cadre && !cadre.dataset.programme) {
    cadre.dataset.programme = "1";
    setTimeout(() => { cadre.dataset.joue = ""; }, 4500);
  }
}
