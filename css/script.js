// AquaProcess — interactions simples (menu mobile)

document.addEventListener("DOMContentLoaded", function () {
  var bouton = document.querySelector(".menu-burger");
  var nav = document.querySelector(".nav-principale");

  if (bouton && nav) {
    bouton.addEventListener("click", function () {
      nav.classList.toggle("ouvert");
    });
  }
});
