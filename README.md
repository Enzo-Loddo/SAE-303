- URL site WEB :
- URL Notebook Observable : https://observablehq.com/@mmi-montbeliard/sae-303-gr-14
- Nom :Loddo
- Prénom :Enzo
- Nom binome :Menigoz
- Prénom binome :Ewan

# Remarques :

- **Site** : « Climat Outre-Mer », récit en 4 temps (contexte, exploration, révélation, conclusion), 5 graphiques interactifs.
- **Routes d'export** : les 5 graphiques sont en route B (dessinés chez le lecteur, filtres et survol), justifié sur la page Méthode.
- **Données** : fichiers légers dans `src/data/` (colonnes utiles, 2 décimales), régénérables avec `node scripts/preparer-donnees.mjs` à partir de `data-source/` (non versionné).
- **Accessibilité** : `<figure>`/`<figcaption>`, texte alternatif et `aria-label` sur chaque graphique, lien d'évitement, focus visible, contrastes, animations coupées si « réduire les animations ».
- **Navigation** : en-tête collant, menu « Parcours de lecture » numéroté 1 à 5, frise de parcours, barre de progression, bouton de remontée.
- **Palettes** : charte (indigo/papier) distincte de la palette des données (une couleur par territoire, Okabe-Ito).

Décrire ici les éléments techniques remarquables de votre site (interactions, navigation, responsive, accessibilité...).
Idéalement avec des liens vers votre site et/ou [votre code](https://github.blog/news-insights/product-news/relative-links-in-markup-files/)
