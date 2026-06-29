// ===========================================================
// Fonction Netlify : liste-contenu
// Lit en temps réel les fichiers .md présents dans content/articles
// et content/projets, et renvoie la liste — remplace le besoin
// de maintenir un fichier index.json à la main.
// ===========================================================

const fs = require("fs");
const path = require("path");

function listerSlugs(dossier) {
  try {
    const cheminComplet = path.join(__dirname, "../../content", dossier);
    const fichiers = fs.readdirSync(cheminComplet);
    return fichiers
      .filter(function (nom) { return nom.endsWith(".md"); })
      .map(function (nom) { return nom.replace(/\.md$/, ""); });
  } catch (erreur) {
    return [];
  }
}

exports.handler = async function () {
  const resultat = {
    articles: listerSlugs("articles"),
    projets: listerSlugs("projets")
  };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"
    },
    body: JSON.stringify(resultat)
  };
};
