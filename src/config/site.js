// ─────────────────────────────────────────────────────────────
// Configuration du site : UN SEUL endroit à modifier pour
// le titre, la description et le menu.
// ─────────────────────────────────────────────────────────────
export const SITE = {
  nom: "Climat Outre-Mer",
  question: "Les DOM-TOM vivent-ils le même changement climatique, au même rythme ?",
  description:
    "La Martinique, La Réunion et la Nouvelle-Calédonie se réchauffent-elles de la même façon ? Une enquête avec les données ouvertes de Météo-France.",
  auteurs: "Enzo Loddo et Ewan Menigoz",
  cadre: "SAE303 · BUT MMI Montbéliard · Université Marie et Louis Pasteur",
  notebook: "https://observablehq.com/@mmi-montbeliard/sae-303-gr-14",
};

// Les 5 questions : alimentent le menu déroulant, l'accueil, la
// conclusion et les liens « précédent / suivant ». Pour changer un
// titre ou l'ordre, modifier ICI uniquement.
export const QUESTIONS = [
  { slug: "repartition", menu: "1 · Années chaudes", question: "Les années les plus chaudes sont-elles toutes récentes ?" },
  { slug: "carte", menu: "2 · Zones", question: "À l'intérieur de chaque territoire, le réchauffement est-il partout le même, ou concentré dans certaines zones ?" },
  { slug: "evolution", menu: "3 · Depuis 1970", question: "Quel territoire se réchauffe le plus vite depuis 1970 ?" },
  { slug: "futur", menu: "4 · En 2050", question: "Quel écart en 2050 ?" },
  { slug: "pluie", menu: "5 · Pluie", question: "La pluie suit-elle la chaleur ?" },
];

// Menu principal, de gauche à droite. L'entrée « questions: true » devient
// le menu déroulant des 5 questions. Pour AJOUTER une page : créer le fichier
// dans src/pages/ puis ajouter UNE ligne ici.
export const MENU = [
  { href: "/", label: "Accueil" },
  { questions: true, label: "Les questions" },
  { href: "/conclusion", label: "Conclusion" },
  { href: "/methode", label: "Méthode" },
];

// Territoires : UNE couleur = UN territoire, partout dans le site.
// Même couleurs dans global.css (--d-*) et dans les graphiques.
export const TERRITOIRES = [
  { id: "martinique", image: "/territoires/martinique.png", nom: "La Martinique", couleur: "#0072B2", ocean: "Caraïbes, Atlantique" },
  { id: "reunion", image: "/territoires/reunion.png", nom: "La Réunion", couleur: "#D55E00", ocean: "Océan Indien" },
  { id: "caledonie", image: "/territoires/caledonie.png", nom: "La Nouvelle-Calédonie", couleur: "#009E73", ocean: "Pacifique Sud" },
];
