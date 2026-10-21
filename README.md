- URL site WEB : [À COMPLÉTER après le déploiement sur Netlify]
- URL Notebook Observable : https://observablehq.com/@mmi-montbeliard/sae-303-gr-14
- Nom :Loddo
- Prénom :Enzo
- Nom binome :Menigoz
- Prénom binome :Ewan

# Remarques :

- **Site** : « Climat Outre-Mer », récit en 4 temps (contexte, exploration, révélation, conclusion), 5 graphiques interactifs, pour un public de l'Hexagone curieux du climat, sans formation scientifique.
- **Routes d'export** : les 5 graphiques sont en route B (dessinés chez le lecteur, filtres et survol), justifié sur la page [Méthode](src/pages/methode.astro).
- **Données** : fichiers légers dans [`src/data/`](src/data/) (colonnes utiles, 2 décimales), régénérables avec [`node scripts/preparer-donnees.mjs`](scripts/preparer-donnees.mjs) à partir de `data-source/` (non versionné).
- **Accessibilité** : `<figure>`/`<figcaption>`, texte alternatif et `aria-label` sur chaque graphique, texte de repli quand JavaScript est désactivé, liste des stations de la carte lisible au clavier, lien d'évitement, focus visible, contrastes, animations coupées si « réduire les animations ».
- **Navigation** : en-tête collant sur ordinateur (non collant sur mobile pour libérer l'écran), menu « Parcours de lecture » numéroté 1 à 5, frise de parcours, barre de progression, bouton de remontée.
- **Responsive** : mises en page en une colonne sur mobile ; sur écran tactile, les informations des territoires de l'accueil s'affichent sans survol.
- **Palettes** : charte (rouge brique / papier) distincte de la palette des données (une couleur par territoire, Okabe-Ito).
