/**
 * Toasts: cierre manual y auto-descarte.
 * Los mensajes los renderiza el servidor con connect-flash; aquí solo se
 * gestiona su desaparición.
 */
(function () {
  "use strict";

  var AUTO_CLOSE_MS = 6000;

  function cerrar(toast) {
    if (!toast || toast.classList.contains("toast--leaving")) return;

    toast.classList.add("toast--leaving");
    window.setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var toasts = document.querySelectorAll("[data-toast]");

    Array.prototype.forEach.call(toasts, function (toast) {
      var boton = toast.querySelector("[data-toast-close]");
      if (boton) {
        boton.addEventListener("click", function () {
          cerrar(toast);
        });
      }

      // Los errores permanecen en pantalla: suelen requerir una acción.
      if (toast.getAttribute("data-toast") === "success") {
        window.setTimeout(function () {
          cerrar(toast);
        }, AUTO_CLOSE_MS);
      }
    });
  });
})();
