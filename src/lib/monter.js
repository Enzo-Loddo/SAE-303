
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

export const largeurDe = (el, min = 320) => Math.max(min, Math.floor(el.clientWidth));

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

export function afficher(zone, ...elements) {
  zone.replaceChildren(...elements);
  const alt = zone.dataset.alt;
  if (alt) {
    zone.querySelectorAll(":scope > svg, :scope > figure > svg").forEach((s) => { s.setAttribute("role", "img"); s.setAttribute("aria-label", alt); });
    zone.querySelectorAll(":scope > div svg").forEach((s) => s.setAttribute("aria-hidden", "true"));
  }
  const cadre = zone.closest("figure");
  if (cadre && !cadre.dataset.programme) {
    cadre.dataset.programme = "1";
    setTimeout(() => { cadre.dataset.joue = ""; }, 4500);
  }
}
