// V2 · À l'intérieur de chaque territoire, le réchauffement est-il partout le même ?
// Recette de la cellule V2_carte du notebook : une carte Leaflet par territoire,
// fond OpenTopoMap, un point par station coloré selon sa tendance (°C par décennie).
import { signe } from "./outils.js";

// L'île entière dans chaque carte
export const CADRES = {
  Martinique: [[14.38, -61.24], [14.89, -60.8]],
  "La Réunion": [[-21.4, 55.21], [-20.86, 55.84]],
  "Nouvelle-Calédonie": [[-22.75, 163.55], [-20.05, 167.55]],
};

// element : le <div> de la carte · L : la bibliothèque Leaflet · couleur : tendance → couleur
export function carteStations(element, tendancesStations, { territoire, couleur, L }) {
  const pts = tendancesStations.filter((d) => d.territoire === territoire && d.latitude != null);
  const carte = L.map(element, { scrollWheelZoom: false });
  L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    maxZoom: 17,
    attribution: "© OpenTopoMap (CC-BY-SA), © OpenStreetMap, SRTM",
  }).addTo(carte);
  pts.forEach((d) =>
    L.circleMarker([d.latitude, d.longitude], { radius: 9, color: "#222", weight: 1.2, fillColor: couleur(d.tendance), fillOpacity: 0.95 })
      .bindTooltip(`${d.nom} : ${signe(d.tendance)} °C/déc.`, { direction: "top", offset: [0, -8] })
      .bindPopup(`<b>${d.nom}</b><br>${d.altitude_m} m d'altitude<br>${signe(d.tendance)} °C par décennie (${d.debut}-${d.fin})`)
      .addTo(carte),
  );
  const cadre = L.latLngBounds(CADRES[territoire]);
  pts.forEach((d) => cadre.extend([d.latitude, d.longitude]));
  carte.fitBounds(cadre, { padding: [10, 10] });
  // si la taille du bloc change (téléphone tourné, fenêtre redimensionnée), on recadre
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      carte.invalidateSize();
      carte.fitBounds(cadre, { padding: [10, 10] });
    }).observe(element);
  }
  return carte;
}
