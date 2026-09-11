/**
 * Ayudas del formulario de servicios.
 *
 * Todo lo que hay aquí es informativo: adelanta al usuario lo que el backend
 * va a validar (cupo, estado del vehículo, coherencia de horas). La decisión
 * de guardar o rechazar siempre la toma el servidor.
 */
(function () {
  "use strict";

  /* --------------- Vista previa del vehículo y aviso de cupo --------------- */

  function iniciarPreviewVehiculo() {
    var select = document.querySelector("[data-vehicle-select]");
    var preview = document.querySelector("[data-vehicle-preview]");
    if (!select || !preview) return;

    var inputPasajeros = document.querySelector("[data-pasajeros]");
    var aviso = document.querySelector("[data-capacidad-aviso]");

    function opcionActual() {
      return select.options[select.selectedIndex];
    }

    function pintarPreview() {
      var opcion = opcionActual();

      if (!opcion || !opcion.value) {
        preview.hidden = true;
        return;
      }

      preview.hidden = false;
      preview.querySelector("[data-preview-title]").textContent = opcion.dataset.nombre || "";
      preview.querySelector("[data-preview-plate]").textContent = opcion.dataset.placa || "";
      preview.querySelector("[data-preview-type]").textContent = opcion.dataset.tipo || "";
      preview.querySelector("[data-preview-capacity]").textContent =
        (opcion.dataset.capacidad || "0") + " pasajeros";

      var badge = preview.querySelector("[data-preview-estado]");
      badge.textContent = opcion.dataset.estado || "";
      badge.className = "badge " + (opcion.dataset.estado === "Disponible" ? "badge--success" : "badge--neutral");
    }

    function revisarCupo() {
      if (!aviso || !inputPasajeros) return;

      var opcion = opcionActual();
      var capacidad = opcion ? parseInt(opcion.dataset.capacidad, 10) : NaN;
      var pasajeros = parseInt(inputPasajeros.value, 10);

      if (!isFinite(capacidad) || !isFinite(pasajeros) || pasajeros <= 0) {
        aviso.hidden = true;
        return;
      }

      if (pasajeros > capacidad) {
        aviso.hidden = false;
        aviso.textContent =
          "Este vehículo tiene capacidad para " + capacidad + " pasajeros. " +
          "Con " + pasajeros + " el servicio será rechazado al guardar.";
      } else {
        aviso.hidden = true;
      }
    }

    select.addEventListener("change", function () {
      pintarPreview();
      revisarCupo();
    });

    if (inputPasajeros) inputPasajeros.addEventListener("input", revisarCupo);

    pintarPreview();
    revisarCupo();
  }

  /* ------------------------ Coherencia de los horarios --------------------- */

  function iniciarValidacionHoras() {
    var salida = document.querySelector("[data-hora-salida]");
    var regreso = document.querySelector("[data-hora-regreso]");
    var aviso = document.querySelector("[data-horario-aviso]");
    if (!salida || !regreso || !aviso) return;

    function aMinutos(valor) {
      var partes = String(valor || "").split(":");
      return (parseInt(partes[0], 10) || 0) * 60 + (parseInt(partes[1], 10) || 0);
    }

    function revisar() {
      if (!salida.value || !regreso.value) {
        aviso.hidden = true;
        return;
      }

      if (aMinutos(regreso.value) <= aMinutos(salida.value)) {
        aviso.hidden = false;
        aviso.textContent = "La hora de regreso debe ser posterior a la hora de salida.";
      } else {
        aviso.hidden = true;
      }
    }

    salida.addEventListener("change", revisar);
    regreso.addEventListener("change", revisar);
    revisar();
  }

  /* ---------------- Normalización visual de la placa (ABC-123) ------------- */

  function iniciarFormatoPlaca() {
    var input = document.querySelector("[data-placa]");
    if (!input) return;

    input.addEventListener("blur", function () {
      var limpia = input.value.toUpperCase().replace(/[\s-]/g, "").trim();
      var carro = limpia.match(/^([A-Z]{3})(\d{3})$/);

      if (carro) {
        input.value = carro[1] + "-" + carro[2];
      } else {
        input.value = limpia;
      }
    });
  }

  /* ----------------- Evita doble envío al guardar formularios -------------- */

  function iniciarProteccionDobleEnvio() {
    var formularios = document.querySelectorAll("form[data-submit-once]");

    Array.prototype.forEach.call(formularios, function (form) {
      form.addEventListener("submit", function () {
        var boton = form.querySelector('button[type="submit"]');
        if (!boton) return;

        // Se difiere para no bloquear el envío en curso.
        window.setTimeout(function () {
          boton.disabled = true;
          boton.textContent = "Guardando...";
        }, 0);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    iniciarPreviewVehiculo();
    iniciarValidacionHoras();
    iniciarFormatoPlaca();
    iniciarProteccionDobleEnvio();
  });
})();
