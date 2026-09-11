/**
 * Sistema de iconos local (trazos de Lucide, https://lucide.dev — ISC).
 *
 * Se incluyen únicamente los iconos que usa la aplicación en lugar de cargar
 * la librería completa desde un CDN: así la interfaz se ve igual aunque el
 * equipo no tenga conexión a internet, que es lo habitual en una sustentación.
 *
 * Uso en las vistas:  <i data-lucide="bus-front"></i>
 */
(function () {
  "use strict";

  var ICONOS = {
    "layout-dashboard":
      '<rect width="7" height="9" x="3" y="3" rx="1"/>' +
      '<rect width="7" height="5" x="14" y="3" rx="1"/>' +
      '<rect width="7" height="9" x="14" y="12" rx="1"/>' +
      '<rect width="7" height="5" x="3" y="16" rx="1"/>',

    "bus-front":
      '<path d="M4 6 2 7"/><path d="M10 6h4"/><path d="m22 7-2-1"/>' +
      '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/>' +
      '<path d="M8 15h.01"/><path d="M16 15h.01"/><path d="M6 19v2"/><path d="M18 21v-2"/>',

    bus:
      '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>' +
      '<path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>' +
      '<circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',

    "car-front":
      '<path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"/>' +
      '<path d="M7 14h.01"/><path d="M17 14h.01"/>' +
      '<rect width="18" height="8" x="3" y="10" rx="2"/><path d="M5 18v2"/><path d="M19 18v2"/>',

    car:
      '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>' +
      '<circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',

    truck:
      '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>' +
      '<path d="M15 18H9"/>' +
      '<path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>' +
      '<circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',

    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>' +
      '<path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',

    route:
      '<circle cx="6" cy="19" r="3"/>' +
      '<path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>' +
      '<circle cx="18" cy="5" r="3"/>',

    wrench:
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',

    "file-text":
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>' +
      '<path d="M14 2v4a2 2 0 0 0 2 2h4"/>' +
      '<path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',

    menu:
      '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/>' +
      '<line x1="4" x2="20" y1="18" y2="18"/>',

    "chevron-right": '<path d="m9 18 6-6-6-6"/>',

    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',

    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',

    "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',

    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',

    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',

    pencil:
      '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>' +
      '<path d="m15 5 4 4"/>',

    "trash-2":
      '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>' +
      '<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>' +
      '<line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',

    "check-circle-2": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    "circle-check": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',

    "alert-triangle":
      '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>' +
      '<path d="M12 9v4"/><path d="M12 17h.01"/>',

    "alert-circle":
      '<circle cx="12" cy="12" r="10"/>' +
      '<line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',

    calendar:
      '<path d="M8 2v4"/><path d="M16 2v4"/>' +
      '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',

    "calendar-off":
      '<path d="M4.18 4.18A2 2 0 0 0 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.82-1.18"/>' +
      '<path d="M21 15.5V6a2 2 0 0 0-2-2H9.5"/><path d="M16 2v4"/>' +
      '<path d="M3 10h7"/><path d="M21 10h-5.5"/><path d="m2 2 20 20"/>',

    "id-card":
      '<path d="M16 10h2"/><path d="M16 14h2"/>' +
      '<path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/>' +
      '<rect x="2" y="5" width="20" height="14" rx="2"/>',

    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',

    printer:
      '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>' +
      '<path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/>' +
      '<rect x="6" y="14" width="12" height="8" rx="1"/>',
  };

  /**
   * Reemplaza cada <i data-lucide="nombre"> por su SVG.
   * Conserva las clases y el estilo en línea del elemento original, que es
   * como las vistas fijan el tamaño (style="width:16px;height:16px").
   */
  function crearIconos(raiz) {
    var pendientes = (raiz || document).querySelectorAll("[data-lucide]");

    Array.prototype.forEach.call(pendientes, function (elemento) {
      var nombre = elemento.getAttribute("data-lucide");
      var trazos = ICONOS[nombre];
      if (!trazos) return;

      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("class", "lucide lucide-" + nombre + " " + (elemento.className || ""));
      svg.innerHTML = trazos;

      // Solo se copia el style si la vista lo declaró: si no, el tamaño lo
      // decide el CSS del componente (.sidebar__link svg, .btn svg, ...).
      var estilo = elemento.getAttribute("style");
      if (estilo) svg.setAttribute("style", estilo);

      elemento.replaceWith(svg);
    });
  }

  window.lucide = { createIcons: crearIconos, icons: ICONOS };

  document.addEventListener("DOMContentLoaded", function () {
    crearIconos(document);
  });
})();
