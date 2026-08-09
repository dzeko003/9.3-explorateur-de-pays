const sortie = document.querySelector("#sortie");

function afficher(html) {
  sortie.innerHTML += html;
}

const CLE_API = "rc_live_48a7d6f7cfc3403fab516b2a6932e553";

const BASE_API = "https://api.restcountries.com/countries/v5";

const CHAMPS =
  "names.common,capitals.name,population,region,languages.name,flag.url_svg,flag.url_png";

const continents = ["Africa", "Americas", "Asia", "Europe", "Oceania"];

let tousLesPays = [];

/**
 * Affiche des cartes "squelette" pendant le chargement.
 */
function afficherChargement() {
  sortie.innerHTML = Array.from({ length: 8 })
    .map(() => `<div class="squelette"></div>`)
    .join("");
}

/**
 * Affiche un message d'erreur clair à la place d'une page blanche.
 * @param {string} message
 */
function afficherErreur(message) {
  sortie.innerHTML = `<div class="erreur"><p>${message}</p></div>`;
}

/**
 * Affiche l'état vide quand aucun pays ne correspond à la recherche
 * ou au filtre en cours.
 */
function afficherEtatVide() {
  sortie.innerHTML = `<p class="etat-vide">Aucun pays ne correspond à cette recherche.</p>`;
}

function normaliserPays(brut) {
  // Certains territoires n'ont pas de capitale : le tableau est vide.
  const capitales = brut.capitals ?? [];
  const langues = brut.languages ?? [];
  const drapeau = brut.flag ?? {};

  return {
    nom: brut.names?.common ?? "Pays inconnu",
    capitale: capitales.length > 0 ? capitales[0].name : "—",
    population: brut.population ?? 0,
    region: brut.region ?? "—",
    langues: langues.map((langue) => langue.name),
    drapeau: drapeau.url_svg || drapeau.url_png || "",
  };
}

/**
 * Met en forme la liste des langues en une chaîne lisible.
 * @param {string[]} langues
 * @returns {string}
 */
function formaterLangues(langues) {
  if (langues.length === 0) {
    return "—";
  }

  return langues.join(", ");
}

/**
 * Construit la carte HTML d'un pays (déjà normalisé).
 * @param {object} pays
 * @returns {string}
 */
function cartePays(pays) {
  const visuel = pays.drapeau
    ? `<img class="drapeau" src="${pays.drapeau}" alt="Drapeau de ${pays.nom}" loading="lazy" />`
    : `<div class="drapeau drapeau-absent" role="img" aria-label="Drapeau non disponible"></div>`;

  return `
    <article class="carte-pays">
      ${visuel}
      <div class="infos-pays">
        <h3>${pays.nom}</h3>
        <p class="capitale">Capitale : ${pays.capitale}</p>
        <p class="population">Population : <strong>${pays.population.toLocaleString("fr-FR")}</strong></p>
        <p class="region">${pays.region}</p>
        <p class="langues">${formaterLangues(pays.langues)}</p>
      </div>
    </article>
  `;
}

/**
 * Affiche une liste de pays, ou l'état vide si la liste est vide.
 * @param {Array<object>} liste
 */
function afficherPays(liste) {
  if (liste.length === 0) {
    afficherEtatVide();
    return;
  }

  sortie.innerHTML = liste.map(cartePays).join("");
}

/**
 * filter : recherche des pays dont le nom contient le texte donné
 * (insensible à la casse).
 * @param {string} texte
 * @returns {Array<object>}
 */
function rechercherParNom(texte) {
  return tousLesPays.filter((pays) =>
    pays.nom.toLowerCase().includes(texte.toLowerCase()),
  );
}

/**
 * filter : ne garde que les pays d'un continent donné.
 * @param {string} continent - "Africa" | "Americas" | "Asia" | "Europe" | "Oceania"
 * @returns {Array<object>}
 */
function filtrerParContinent(continent) {
  return tousLesPays.filter((pays) => pays.region === continent);
}

/**
 * sort : trie une copie de la liste par population.
 * @param {Array<object>} liste
 * @param {"croissant"|"decroissant"} ordre
 * @returns {Array<object>}
 */
function trierParPopulation(liste, ordre = "decroissant") {
  const copie = [...liste];

  return copie.sort((a, b) =>
    ordre === "decroissant"
      ? b.population - a.population
      : a.population - b.population,
  );
}

/**
 * Traduit un code HTTP d'échec en message compréhensible. Les trois
 * premiers cas sont les erreurs propres à la v5, celles qu'on rencontre
 * en pratique en branchant sa clé.
 * @param {number} statut
 * @returns {string}
 */
function messageErreurHttp(statut) {
  if (statut === 401) {
    return "Clé d'API refusée (401). Vérifiez la constante CLE_API en haut de pays.js.";
  }

  if (statut === 403) {
    return (
      "Origine non autorisée (403). Ajoutez le domaine de ce site aux " +
      "origines autorisées de votre clé sur restcountries.com/api-keys."
    );
  }

  if (statut === 429) {
    return "Quota de requêtes dépassé (429). Réessayez dans quelques minutes.";
  }

  return `L'API a répondu une erreur ${statut}. Réessayez plus tard.`;
}

/**
 * Récupère les pays des 5 continents en parallèle (Promise.all),
 * les assemble en un seul tableau, puis affiche un premier résultat
 * filtré + trié pour prouver que le pipeline fonctionne vraiment.
 */
async function chargerPays() {
  afficherChargement();

  if (CLE_API === "rc_live_demo") {
    afficherErreur(
      "Aucune clé d'API renseignée. Créez un compte gratuit sur " +
        "restcountries.com/sign-up, puis collez votre clé dans la constante " +
        "CLE_API en haut de pays.js.",
    );
    return;
  }

  try {
    const reponses = await Promise.all(
      continents.map((continent) =>
        // limit=100 : le palier gratuit plafonne à 100 résultats par
        // requête, et aucun continent ne dépasse 60 pays. Une seule
        // requête suffit donc par continent, sans pagination.
        fetch(
          `${BASE_API}/region/${continent}?limit=100&response_fields=${CHAMPS}`,
          { headers: { Authorization: `Bearer ${CLE_API}` } },
        ),
      ),
    );

    for (const reponse of reponses) {
      if (!reponse.ok) {
        throw new Error(messageErreurHttp(reponse.status));
      }
    }

    const donneesParContinent = await Promise.all(
      reponses.map((reponse) => reponse.json()),
    );

    // La v5 enveloppe toujours sa réponse dans { data: { objects: [...] } },
    // là où la v3.1 renvoyait directement un tableau.
    // map + flat : on assemble les 5 tableaux (un par continent) en un seul,
    // puis on normalise chaque pays.
    tousLesPays = donneesParContinent
      .map((bloc) => bloc.data.objects)
      .flat()
      .map(normaliserPays);

    console.log(`${tousLesPays.length} pays chargés au total.`);
    console.log("Recherche 'congo' :", rechercherParNom("congo"));
    console.log(
      "5 pays les moins peuplés :",
      trierParPopulation(tousLesPays, "croissant").slice(0, 5),
    );

    // La barre d'outils (recherche, continent, tri) est une maquette
    // cette semaine. Pour prouver que filtrer et trier fonctionnent
    // vraiment, on affiche les pays d'Afrique triés par population
    // décroissante. Les vrais sélecteurs seront branchés avec
    // addEventListener en semaine 10.
    afficherPays(trierParPopulation(filtrerParContinent("Africa")));
  } catch (erreur) {
    console.error("Erreur lors du chargement des pays :", erreur);
    afficherErreur(
      erreur.message ||
        "Impossible de charger la liste des pays pour le moment. Vérifiez votre connexion et rechargez la page.",
    );
  }
}

chargerPays();
