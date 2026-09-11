/**
 * Comportamiento general: sidebar móvil, envío automático de filtros
 * e inicialización de los iconos de Lucide.
 */
(function () {
  "use strict";

  /* ------------------------------ Sidebar móvil ---------------------------- */

  function iniciarSidebar() {
    var toggle = document.querySelector("[data-sidebar-toggle]");
    var sidebar = document.querySelector("[data-sidebar]");
    var overlay = document.querySelector("[data-sidebar-overlay]");
    if (!toggle || !sidebar || !overlay) return;

    function abrir() {
      sidebar.classList.add("is-open");
      overlay.classList.add("is-visible");
    }

    function cerrar() {
      sidebar.classList.remove("is-open");
      overlay.classList.remove("is-visible");
    }

    toggle.addEventListener("click", function () {
      if (sidebar.classList.contains("is-open")) cerrar();
      else abrir();
    });

    overlay.addEventListener("click", cerrar);

    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape") cerrar();
    });
  }

  /* ---------------------- Filtros que se aplican solos --------------------- */

  function iniciarFiltros() {
    var formulario = document.querySelector("[data-filter-form]");
    if (!formulario) return;

    // Los select y las fechas aplican el filtro al cambiar.
    var controles = formulario.querySelectorAll("select, input[type='date']");
    Array.prototype.forEach.call(controles, function (control) {
      control.addEventListener("change", function () {
        formulario.submit();
      });
    });

    // El buscador espera a que el usuario deje de escribir.
    var buscador = formulario.querySelector("input[type='search']");
    if (buscador) {
      var temporizador = null;

      buscador.addEventListener("input", function () {
        window.clearTimeout(temporizador);
        temporizador = window.setTimeout(function () {
          formulario.submit();
        }, 450);
      });
    }
  }

  /* -------------------------------- Iconos --------------------------------- */

  function iniciarIconos() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    iniciarSidebar();
    iniciarFiltros();
    iniciarIconos();
  });
})();
