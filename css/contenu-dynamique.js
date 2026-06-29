// ===========================================================
// AquaProcess — chargement dynamique des articles et mini-projets
// Lit les fichiers Markdown créés via /admin (Decap CMS) et les
// affiche sous forme de cartes sur articles.html / projets.html
// ===========================================================

(function () {
  "use strict";

  // Analyse simple du frontmatter YAML (--- ... ---) en haut d'un .md
  function analyserFrontmatter(texte) {
    var resultat = { donnees: {}, contenu: texte };
    var correspondance = texte.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!correspondance) return resultat;

    var bloc = correspondance[1];
    var contenu = correspondance[2];
    var donnees = {};

    bloc.split("\n").forEach(function (ligne) {
      var deuxPoints = ligne.indexOf(":");
      if (deuxPoints === -1) return;
      var cle = ligne.slice(0, deuxPoints).trim();
      var valeur = ligne.slice(deuxPoints + 1).trim();
      valeur = valeur.replace(/^["']|["']$/g, "");
      donnees[cle] = valeur;
    });

    resultat.donnees = donnees;
    resultat.contenu = contenu;
    return resultat;
  }

  function formaterDate(chaineISO) {
    if (!chaineISO) return "";
    var d = new Date(chaineISO);
    if (isNaN(d.getTime())) return chaineISO;
    var mois = [
      "janvier", "février", "mars", "avril", "mai", "juin",
      "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ];
    return d.getDate() + " " + mois[d.getMonth()] + " " + d.getFullYear();
  }

  // Charge la liste des contenus disponibles, puis chaque fichier .md.
  // Essaie d'abord la fonction Netlify (toujours à jour automatiquement),
  // et se rabat sur content/index.json si la fonction n'est pas disponible
  // (par exemple en test local sans Netlify).
  function recupererIndex() {
    return fetch("/api/liste-contenu")
      .then(function (r) {
        if (!r.ok) throw new Error("fonction indisponible");
        return r.json();
      })
      .catch(function () {
        return fetch("content/index.json").then(function (r) { return r.json(); });
      });
  }

  function chargerCollection(nomCollection, callback) {
    recupererIndex()
      .then(function (index) {
        var slugs = index[nomCollection] || [];
        var promesses = slugs.map(function (slug) {
          return fetch("content/" + nomCollection + "/" + slug + ".md")
            .then(function (r) { return r.text(); })
            .then(function (texte) {
              var analyse = analyserFrontmatter(texte);
              analyse.donnees.slug = slug;
              return analyse;
            });
        });
        return Promise.all(promesses);
      })
      .then(callback)
      .catch(function (erreur) {
        console.error("Erreur de chargement du contenu :", erreur);
        callback([]);
      });
  }

  function creerCarteListe(item, typeCollection) {
    var d = item.donnees;
    var carte = document.createElement("div");
    carte.className = "carte";

    var dossierPage = typeCollection === "articles" ? "articles" : "projets";
    var lienVers = dossierPage + "/voir.html?slug=" + encodeURIComponent(d.slug);

    var metaGauche =
      typeCollection === "articles"
        ? formaterDate(d.date)
        : (d.type_projet || "");

    var labelLien = typeCollection === "articles" ? "Lire →" : "Voir →";

    carte.innerHTML =
      '<span class="carte-etiquette">' + (d.theme || "") + "</span>" +
      "<h3>" + (d.titre || "Sans titre") + "</h3>" +
      "<p>" + (d.resume || "") + "</p>" +
      '<div class="carte-meta">' +
      "<span>" + metaGauche + "</span>" +
      '<a href="' + lienVers + '" class="carte-lien">' + labelLien + "</a>" +
      "</div>";

    return carte;
  }

  function afficherListe(typeCollection, idConteneur) {
    var conteneur = document.getElementById(idConteneur);
    if (!conteneur) return;

    chargerCollection(typeCollection, function (items) {
      conteneur.innerHTML = "";

      if (items.length === 0) {
        var vide = document.createElement("div");
        vide.className = "carte carte-vide";
        vide.innerHTML =
          '<div class="icone-vide">✎</div><p>Rien de publié pour le moment.</p>';
        conteneur.appendChild(vide);
        return;
      }

      // Les plus récents en premier (si une date existe)
      items.sort(function (a, b) {
        return (b.donnees.date || "").localeCompare(a.donnees.date || "");
      });

      items.forEach(function (item) {
        conteneur.appendChild(creerCarteListe(item, typeCollection));
      });
    });
  }

  // Affiche le détail d'un seul article/projet à partir du paramètre ?slug=
  function afficherDetail(typeCollection, idConteneur) {
    var conteneur = document.getElementById(idConteneur);
    if (!conteneur) return;

    var parametres = new URLSearchParams(window.location.search);
    var slug = parametres.get("slug");

    if (!slug) {
      conteneur.innerHTML = "<p>Contenu introuvable.</p>";
      return;
    }

    fetch("../content/" + typeCollection + "/" + slug + ".md")
      .then(function (r) {
        if (!r.ok) throw new Error("introuvable");
        return r.text();
      })
      .then(function (texte) {
        var analyse = analyserFrontmatter(texte);
        var d = analyse.donnees;

        document.title = (d.titre || "Sans titre") + " — AquaProcess";

        var metaHtml =
          typeCollection === "articles"
            ? "<span>📅 " + formaterDate(d.date) + "</span>"
            : "<span>🎓 " + (d.type_projet || "") + "</span>" +
              (d.periode ? "<span>📅 " + d.periode + "</span>" : "");

        var imageHtml = d.image_couverture
          ? '<img src="../' + d.image_couverture + '" alt="' + (d.titre || "") + '" style="border-radius:8px; margin-bottom:24px;">'
          : "";

        var corpsHtml;
        if (window.marked && typeof window.marked.parse === "function") {
          corpsHtml = window.marked.parse(analyse.contenu);
        } else {
          // Repli si la librairie marked n'a pas pu charger :
          // affichage simple en paragraphes, sans mise en forme avancée.
          corpsHtml = analyse.contenu
            .trim()
            .split(/\n\s*\n/)
            .map(function (bloc) { return "<p>" + bloc.trim() + "</p>"; })
            .join("");
        }

        conteneur.innerHTML =
          '<div class="article-entete">' +
          '<span class="hero-etiquette">' + (d.theme || "") + "</span>" +
          "<h1>" + (d.titre || "Sans titre") + "</h1>" +
          '<div class="article-meta">' + metaHtml + "</div>" +
          "</div>" +
          '<div class="contenu-article">' +
          imageHtml +
          corpsHtml +
          "</div>";
      })
      .catch(function () {
        conteneur.innerHTML = "<p>Ce contenu n'existe pas ou plus.</p>";
      });
  }

  window.AquaProcessContenu = {
    afficherListe: afficherListe,
    afficherDetail: afficherDetail
  };
})();
