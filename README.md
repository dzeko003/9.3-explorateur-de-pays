# Explorateur de pays

Projet Semaine 9 — Akieni Academy — Phase 2 (Asynchrone, fetch & APIs, niveau avancé)
**Livrable officiel de la semaine.**

## Démonstration en ligne

voir le site en ligne :

https://dzeko003.github.io/9.3-explorateur-de-pays/

## À quoi sert ce projet

Une application de recherche de pays, en grille responsive, construite
sur l'API [REST Countries](https://restcountries.com/). Les données
des 5 continents sont récupérées en parallèle avec `Promise.all`, puis
assemblées en un seul tableau réutilisé par la recherche, le filtrage
et le tri.

Le projet couvre :

- `fetch` et `async` / `await`
- `filter` et `map` sur des données d'API
- `Promise.all` pour des requêtes multiples
- une gestion complète des erreurs (réseau, clé d'API refusée, origine
  non autorisée, quota dépassé)
- l'authentification d'une API par en-tête `Authorization: Bearer`

## Structure du projet

```
explorateur-de-pays/
├── index.html   <- barre d'outils, grille de cartes, état vide
├── style.css    <- grille auto-fill, squelettes de chargement, hover
├── pays.js      <- Promise.all, recherche, filtre, tri, affichage
└── README.md    <- ce fichier
```

## L'API utilisée

[REST Countries v5](https://restcountries.com/docs/countries), endpoint
`/countries/v5/region/{continent}`, appelé une fois par continent
(Africa, Americas, Asia, Europe, Oceania) via `Promise.all` — plutôt
qu'un seul appel global, pour pratiquer vraiment les requêtes multiples
en parallèle. Le paramètre `response_fields` limite la réponse aux
champs utilisés : `names.common`, `capitals.name`, `population`,
`region`, `languages.name`, `flag.url_svg`, `flag.url_png`.

### Migration depuis la v3.1

La v3.1 utilisée au départ a été mise hors service : toutes ses URL
renvoient une redirection 301 vers un fichier qui répond
`"This API version has been deprecated... migrate to our new version (v5)"`.
La v5 exige une clé d'API. Trois choses ont changé dans `pays.js` :

|         | v3.1                     | v5                                    |
| ------- | ------------------------ | ------------------------------------- |
| Base    | `restcountries.com/v3.1` | `api.restcountries.com/countries/v5`  |
| Auth    | aucune                   | en-tête `Authorization: Bearer <clé>` |
| Réponse | tableau de pays          | `{ data: { objects: [...] } }`        |

La forme des champs a changé aussi (`name.common` → `names.common`,
`capital` → `capitals` (objets), `languages` (objet) → tableau,
`flags.svg` → `flag.url_svg`). Tout est absorbé par la fonction
`normaliserPays()`, à un seul endroit, pour que le reste du code
(recherche, filtre, tri, affichage) reste inchangé.

## Configurer sa clé d'API

1. Créer un compte gratuit sur https://restcountries.com/sign-up
2. Coller la clé dans la constante `CLE_API`, en haut de `pays.js`.
3. Sur https://restcountries.com/api-keys, ajouter les **origines
   autorisées** de la clé — sinon le navigateur reçoit une 403
   `originNotAllowed` :
   - `dzeko003.github.io` pour le site en ligne
   - `localhost` pour les tests en local

La clé est visible dans le code source : c'est inévitable pour un site
statique sans serveur, et sans gravité ici parce que la v5 verrouille
chaque clé sur ses origines autorisées — recopiée ailleurs, elle est
refusée. Ce raccourci ne vaut que pour un service offrant ce verrou.

Le palier gratuit plafonne à 100 résultats par requête ; aucun
continent ne dépassant 60 pays, une requête par continent suffit et
la pagination est inutile.

## Comment tester

1. Ouvrir `index.html` dans un navigateur.
2. Des squelettes gris animés s'affichent pendant le chargement (5
   requêtes en parallèle), puis sont remplacés par les cartes.
3. La page affiche par défaut les pays d'Afrique triés par population
   décroissante — `afficherPays(trierParPopulation(filtrerParContinent("Africa")))`
   à la fin de `pays.js`. C'est la preuve que `filtrerParContinent` et
   `trierParPopulation` fonctionnent réellement sur les données de
   l'API, et pas seulement dans la console.
4. Ouvrir la console pour voir le nombre total de pays chargés, un
   exemple de recherche par nom (`rechercherParNom("congo")`) et les
   5 pays les moins peuplés.
5. Pour voir l'état vide, appeler `afficherPays(rechercherParNom("xyz"))`
   dans la console : le message "Aucun pays ne correspond à cette
   recherche" s'affiche à la place de la grille.

La barre d'outils (recherche, sélecteur de continent, sélecteur de
tri) est pour l'instant une maquette — elle sera branchée pour de vrai
avec `addEventListener` en semaine 10.

## Capture d'écran

[capture](./capture.png)
