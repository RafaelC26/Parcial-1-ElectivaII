/**
 * Modal de confirmación para acciones destructivas.
 *
 * Un formulario con [data-confirm] no se envía directamente: primero abre el
 * modal y solo se envía cuando el usuario confirma. La eliminación real la
 * decide el backend, esto es únicamente la barrera de interfaz.
 */
(function () {
  "use strict";

  var ICONO_ALERTA =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>' +
    '<path d="M12 9v4"/><path d="M12 17h.01"/></svg>';

  function escaparHtml(texto) {
    var div = document.createElement("div");
    div.textContent = texto == null ? "" : String(texto);
    return div.innerHTML;
  }

  function abrirModal(opciones, alConfirmar) {
    var backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";

    backdrop.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal__body">' +
      '<div class="modal__icon">' + ICONO_ALERTA + "</div>" +
      '<h2 class="modal__title">' + escaparHtml(opciones.titulo) + "</h2>" +
      '<p class="modal__text">' + escaparHtml(opciones.mensaje) + "</p>" +
      '<p class="modal__warning">Esta acción no puede deshacerse.</p>' +
      "</div>" +
      '<div class="modal__footer">' +
      '<button type="button" class="btn btn--secondary" data-cancelar>Cancelar</button>' +
      '<button type="button" class="btn btn--danger" data-confirmar>' +
      escaparHtml(opciones.confirmar || "Eliminar") +
      "</button>" +
      "</div></div>";

    document.body.appendChild(backdrop);

    var botonConfirmar = backdrop.querySelector("[data-confirmar]");
    botonConfirmar.focus();

    function cerrar() {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      document.removeEventListener("keydown", alPresionarTecla);
    }

    function alPresionarTecla(evento) {
      if (evento.key === "Escape") cerrar();
    }

    backdrop.querySelector("[data-cancelar]").addEventListener("click", cerrar);
    botonConfirmar.addEventListener("click", function () {
      cerrar();
      alConfirmar();
    });

    backdrop.addEventListener("click", function (evento) {
      if (evento.target === backdrop) cerrar();
    });

    document.addEventListener("keydown", alPresionarTecla);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var formularios = document.querySelectorAll("form[data-confirm]");

    Array.prototype.forEach.call(formularios, function (form) {
      form.addEventListener("submit", function (evento) {
        if (form.dataset.confirmed === "true") return;

        evento.preventDefault();

        abrirModal(
          {
            titulo: form.getAttribute("data-confirm-title") || "Confirmar acción",
            mensaje: form.getAttribute("data-confirm") || "¿Deseas continuar?",
            confirmar: form.getAttribute("data-confirm-button") || "Eliminar",
          },
          function () {
            form.dataset.confirmed = "true";
            form.submit();
          }
        );
      });
    });
  });
})();
