// ===========================================================
// AquaProcess — animation de molécules H2O en arrière-plan
// Canvas HTML5 : molécules flottantes connectées entre elles,
// avec réaction légère au mouvement de la souris.
// ===========================================================

(function () {
  "use strict";

  var canvas = document.getElementById("canvas-molecules");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var conteneur = canvas.parentElement;

  var largeur, hauteur;
  var molecules = [];
  var souris = { x: null, y: null, actif: false };

  // Respecte la préférence "mouvement réduit" du système
  var reduireMouvement = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var COULEUR_LIAISON = "rgba(29, 111, 163, 0.18)";
  var COULEUR_OXYGENE = "#1d6fa3";
  var COULEUR_HYDROGENE = "#7fb2d8";
  var DISTANCE_LIAISON = 150;
  var NB_MOLECULES_DESKTOP = 22;
  var NB_MOLECULES_MOBILE = 11;

  function redimensionner() {
    largeur = conteneur.offsetWidth;
    hauteur = conteneur.offsetHeight;
    canvas.width = largeur;
    canvas.height = hauteur;
  }

  // Une "molécule" = un atome d'oxygène (gros point) + 2 hydrogènes (petits points)
  // qui orbitent doucement autour de lui pour suggérer la forme H2O.
  function Molecule() {
    this.x = Math.random() * largeur;
    this.y = Math.random() * hauteur;
    this.vx = (Math.random() - 0.5) * 0.35;
    this.vy = (Math.random() - 0.5) * 0.35;
    this.rayon = 4 + Math.random() * 3;
    this.angle = Math.random() * Math.PI * 2;
    this.vitesseAngle = 0.005 + Math.random() * 0.01;
  }

  Molecule.prototype.avancer = function () {
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.vitesseAngle;

    if (this.x < -20) this.x = largeur + 20;
    if (this.x > largeur + 20) this.x = -20;
    if (this.y < -20) this.y = hauteur + 20;
    if (this.y > hauteur + 20) this.y = -20;

    // Légère attraction vers la souris, douce et limitée
    if (souris.actif) {
      var dx = souris.x - this.x;
      var dy = souris.y - this.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 180 && distance > 0) {
        var force = (180 - distance) / 180 * 0.02;
        this.x += dx * force * 0.05;
        this.y += dy * force * 0.05;
      }
    }
  };

  Molecule.prototype.dessiner = function () {
    var ecart = this.rayon * 2.4;

    var hx1 = this.x + Math.cos(this.angle) * ecart;
    var hy1 = this.y + Math.sin(this.angle) * ecart;
    var hx2 = this.x + Math.cos(this.angle + 2.1) * ecart;
    var hy2 = this.y + Math.sin(this.angle + 2.1) * ecart;

    // Liaisons internes O-H
    ctx.strokeStyle = "rgba(29, 111, 163, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(hx1, hy1);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(hx2, hy2);
    ctx.stroke();

    // Atome d'oxygène (centre)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.rayon, 0, Math.PI * 2);
    ctx.fillStyle = COULEUR_OXYGENE;
    ctx.fill();

    // Atomes d'hydrogène
    ctx.beginPath();
    ctx.arc(hx1, hy1, this.rayon * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = COULEUR_HYDROGENE;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(hx2, hy2, this.rayon * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = COULEUR_HYDROGENE;
    ctx.fill();
  };

  function dessinerLiaisonsEntreMolecules() {
    for (var i = 0; i < molecules.length; i++) {
      for (var j = i + 1; j < molecules.length; j++) {
        var dx = molecules[i].x - molecules[j].x;
        var dy = molecules[i].y - molecules[j].y;
        var distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < DISTANCE_LIAISON) {
          var opacite = 1 - distance / DISTANCE_LIAISON;
          ctx.strokeStyle = "rgba(29, 111, 163, " + (opacite * 0.25) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(molecules[i].x, molecules[i].y);
          ctx.lineTo(molecules[j].x, molecules[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function boucleAnimation() {
    ctx.clearRect(0, 0, largeur, hauteur);

    dessinerLiaisonsEntreMolecules();

    for (var i = 0; i < molecules.length; i++) {
      molecules[i].avancer();
      molecules[i].dessiner();
    }

    requestAnimationFrame(boucleAnimation);
  }

  function dessinerImageStatique() {
    // Pour les personnes qui préfèrent un mouvement réduit :
    // une seule image fixe, pas d'animation continue.
    ctx.clearRect(0, 0, largeur, hauteur);
    dessinerLiaisonsEntreMolecules();
    for (var i = 0; i < molecules.length; i++) {
      molecules[i].dessiner();
    }
  }

  function initialiser() {
    redimensionner();

    var nb = largeur < 640 ? NB_MOLECULES_MOBILE : NB_MOLECULES_DESKTOP;
    molecules = [];
    for (var i = 0; i < nb; i++) {
      molecules.push(new Molecule());
    }

    if (reduireMouvement) {
      dessinerImageStatique();
    } else {
      boucleAnimation();
    }
  }

  window.addEventListener("resize", function () {
    redimensionner();
  });

  conteneur.addEventListener("mousemove", function (e) {
    var rect = canvas.getBoundingClientRect();
    souris.x = e.clientX - rect.left;
    souris.y = e.clientY - rect.top;
    souris.actif = true;
  });

  conteneur.addEventListener("mouseleave", function () {
    souris.actif = false;
  });

  initialiser();
})();
