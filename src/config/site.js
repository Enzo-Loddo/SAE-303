export const SITE = {
  nom: "Climat Outre-Mer",
  question: "La Réunion, la Martinique et la Nouvelle-Calédonie vivent-elles le même changement climatique, au même rythme ?",
  description:
    "La Martinique, La Réunion et la Nouvelle-Calédonie se réchauffent-elles de la même façon ? Une enquête avec les données ouvertes de Météo-France.",
  auteurs: "Enzo Loddo et Ewan Menigoz",
  cadre: "SAE303 · BUT MMI Montbéliard · Université Marie et Louis Pasteur",
  notebook: "https://observablehq.com/@mmi-montbeliard/sae-303-gr-14",
};

export const QUESTIONS = [
  { slug: "repartition", temps: "Exploration", menu: "1 · Années chaudes", question: "Les années les plus chaudes sont-elles toutes récentes ?" },
  { slug: "carte", temps: "Exploration", menu: "2 · Zones", question: "À l'intérieur de chaque territoire, le réchauffement est-il partout le même, ou concentré dans certaines zones ?" },
  { slug: "evolution", temps: "Révélation", menu: "3 · Depuis 1970", question: "Quel territoire se réchauffe le plus vite depuis 1970 ?" },
  { slug: "futur", temps: "Révélation", menu: "4 · D'ici 2100", question: "Quel écart de température en 2050, et jusqu'en 2100 ?" },
  { slug: "pluie", temps: "Révélation", menu: "5 · Pluie", question: "La pluie suit-elle la chaleur ?" },
];

export const MENU = [
  { href: "/", label: "Accueil" },
  { questions: true, label: "Les questions" },
  { href: "/conclusion", label: "Conclusion" },
  { href: "/methode", label: "Méthode" },
];

export const TERRITOIRES = [
  { id: "martinique", fuseau: "America/Martinique", utc: "UTC−4", faits: ["Le volcan de la montagne Pelée culmine à 1 397 m.", "Environ 1 128 km² : la plus petite des trois îles.", "Dans notre étude : 3 stations, +0,31 °C par décennie, record en 2024."], image: "/territoires/martinique.png", nom: "La Martinique", couleur: "#0072B2", ocean: "Caraïbes, Atlantique" },
  { id: "reunion", fuseau: "Indian/Reunion", utc: "UTC+4", faits: ["Le Piton des Neiges, point culminant, dépasse 3 000 m.", "Le Piton de la Fournaise est l’un des volcans les plus actifs du monde.", "Dans notre étude : 4 stations, +0,19 °C par décennie, record en 2019."], image: "/territoires/reunion.png", nom: "La Réunion", couleur: "#D55E00", ocean: "Océan Indien" },
  { id: "caledonie", fuseau: "Pacific/Noumea", utc: "UTC+11", faits: ["Entourée de l’un des plus grands lagons du monde, classé à l’UNESCO.", "Environ 18 600 km² : la plus étendue des trois.", "Dans notre étude : 15 stations, +0,23 °C par décennie, record en 2022."], image: "/territoires/caledonie.png", nom: "La Nouvelle-Calédonie", couleur: "#009E73", ocean: "Pacifique Sud" },
];
