(() => {
  const WHATSAPP_NUMBER = "59899123456";
  const DEFAULT_WA_MESSAGE = "Hola ASESPRO, quiero informacion sobre una propiedad.";

  const normalize = (value = "") =>
    value
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const pageFile = window.location.pathname.split("/").pop() || "index.html";

  const toRouteFromText = (text) => {
    const t = normalize(text);
    if (!t) return null;
    if (t.includes("inicio")) return "index.html";
    if (t.includes("alquiler")) return "alquiler.html";
    if (t.includes("venta")) return "venta.html";
    if (t.includes("limpieza")) return "servicio-limpieza.html";
    if (t.includes("contact")) return "contacto.html";
    if (t.includes("detalle") || t.includes("mirador")) return "detalle-penthouse.html";
    if (t.includes("catalogo completo")) return "alquiler.html";
    if (t.includes("saber mas")) return "servicio-limpieza.html";
    return null;
  };

  const getWhatsAppUrl = (message) =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message || DEFAULT_WA_MESSAGE)}`;

  const openWhatsApp = (message) => {
    window.open(getWhatsAppUrl(message), "_blank", "noopener,noreferrer");
  };

  const goTo = (route) => {
    if (!route) return;
    window.location.href = route;
  };

  const showToast = (message) => {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.left = "50%";
    toast.style.bottom = "24px";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "rgba(0, 107, 49, 0.95)";
    toast.style.color = "#ffffff";
    toast.style.padding = "10px 16px";
    toast.style.borderRadius = "999px";
    toast.style.fontSize = "14px";
    toast.style.fontWeight = "700";
    toast.style.zIndex = "9999";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
  };

  const getLocationText = () =>
    document.querySelector("[data-location]")?.getAttribute("data-location") || "Montevideo, Uruguay";

  const openMap = () => {
    const query = encodeURIComponent(getLocationText());
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
  };

  const pageActiveWord = () => {
    const map = {
      "index.html": "inicio",
      "alquiler.html": "alquiler",
      "venta.html": "venta",
      "servicio-limpieza.html": "limpieza",
      "contacto.html": "contacto",
      "detalle-penthouse.html": "alquiler",
      "detalle-propiedad.html": "alquiler",
    };
    return map[pageFile] || "";
  };

  const wireNavLinks = () => {
    const activeWord = pageActiveWord();
    document.querySelectorAll("nav a").forEach((link) => {
      const route = toRouteFromText(link.textContent);
      if (route) {
        link.setAttribute("href", route);
      }
      if (activeWord && normalize(link.textContent).includes(activeWord)) {
        link.style.color = "#047857";
        link.style.borderBottom = "2px solid #047857";
        link.style.paddingBottom = "4px";
        link.style.fontWeight = "700";
      }
    });
  };

  const wireAnchors = () => {
    document.querySelectorAll("a").forEach((anchor) => {
      const text = normalize(anchor.textContent);
      const href = (anchor.getAttribute("href") || "").trim();

      if (href === "#" || href === "") {
        const route = toRouteFromText(text);
        if (route) {
          anchor.setAttribute("href", route);
        }
      }

      const currentHref = anchor.getAttribute("href") || "";
      const isWhatsapp = text.includes("whatsapp") || currentHref.includes("wa.me/");
      if (isWhatsapp && (currentHref === "#" || currentHref.includes("wa.me/#") || currentHref.endsWith("wa.me/"))) {
        anchor.setAttribute("href", getWhatsAppUrl(DEFAULT_WA_MESSAGE));
      }

      if ((anchor.getAttribute("href") || "").includes("wa.me/")) {
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noopener noreferrer");
      }
    });
  };

  const getButtonAction = (text) => {
    const t = normalize(text);

    if (!t) return null;
    if (t.includes("ver propiedades") || t.includes("explorar alquiler")) return { type: "route", value: "alquiler.html" };
    if (t.includes("explorar ventas") || t.includes("propiedades en venta")) return { type: "route", value: "venta.html" };
    if (t.includes("solicitar servicio") || t.includes("agendar servicio") || t.includes("ver portafolio")) {
      return { type: "route", value: "servicio-limpieza.html" };
    }
    if (t.includes("saber mas")) return { type: "route", value: "servicio-limpieza.html" };
    if (t.includes("ver detalles")) return { type: "route", value: "detalle-penthouse.html" };
    if (t.includes("filtrar")) return { type: "filter" };
    if (t.includes("activar mapa") || t.includes("vista de mapa") || t.includes("pantalla completa")) {
      return { type: "map" };
    }

    const whatsappKeywords = [
      "consultar",
      "agendar cita",
      "programar visita",
      "contactar por whatsapp",
      "contactar ahora por whatsapp",
      "whatsapp inquiry",
      "whatsapp",
      "publicar propiedad",
      "agendar visita",
      "enviar mensaje",
      "enviar solicitud",
    ];

    if (whatsappKeywords.some((word) => t.includes(word))) {
      return { type: "whatsapp" };
    }

    return null;
  };

  const wireButtons = () => {
    document.querySelectorAll("button").forEach((button) => {
      const action = getButtonAction(button.textContent);
      if (!action) return;

      if (action.type === "filter") return;

      button.addEventListener("click", (event) => {
        if (action.type === "route") {
          event.preventDefault();
          goTo(action.value);
          return;
        }

        if (action.type === "map") {
          event.preventDefault();
          openMap();
          return;
        }

        if (action.type === "whatsapp") {
          event.preventDefault();
          const title = document.title || "ASESPRO";
          openWhatsApp(`Hola ASESPRO, quiero informacion sobre: ${title}.`);
        }
      });
    });
  };

  const parsePrice = (rawText) => {
    const text = (rawText || "").toString().trim();
    if (!text) return NaN;

    const hasM = /m\b/i.test(text);
    const hasK = /k\b/i.test(text);

    let cleaned = text.replace(/[^0-9.,]/g, "");
    if (!cleaned) return NaN;

    if (cleaned.includes(",") && cleaned.includes(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else if (cleaned.includes(".")) {
      const parts = cleaned.split(".");
      if (parts[parts.length - 1].length === 3) {
        cleaned = parts.join("");
      }
    } else if (cleaned.includes(",")) {
      const parts = cleaned.split(",");
      if (parts[parts.length - 1].length === 3) {
        cleaned = parts.join("");
      } else {
        cleaned = cleaned.replace(",", ".");
      }
    }

    let value = Number(cleaned);
    if (Number.isNaN(value)) return NaN;
    if (hasM) value *= 1000000;
    if (hasK) value *= 1000;
    return value;
  };

  const getCardPrice = (card) => {
    const candidates = Array.from(card.querySelectorAll("span, p, div"));
    for (const el of candidates) {
      const text = el.textContent || "";
      if (!/[\$€]/.test(text)) continue;
      const value = parsePrice(text);
      if (!Number.isNaN(value)) return value;
    }
    return NaN;
  };

  const priceInRange = (price, selectedText) => {
    const selected = normalize(selectedText);
    if (!selected || selected.includes("cualquier") || selected.includes("todos")) return true;
    if (Number.isNaN(price)) return true;

    const values = selectedText.match(/\d+[\d.,]*\s*[kKmM]?/g) || [];
    const parsed = values.map(parsePrice).filter((n) => !Number.isNaN(n));

    if (selected.includes("+") && parsed.length >= 1) {
      return price >= parsed[0];
    }

    if (parsed.length >= 2) {
      const min = Math.min(parsed[0], parsed[1]);
      const max = Math.max(parsed[0], parsed[1]);
      return price >= min && price <= max;
    }

    if (parsed.length === 1) {
      return price >= parsed[0];
    }

    return true;
  };

  const initListingFilters = () => {
    const filterButton = Array.from(document.querySelectorAll("button")).find((btn) =>
      normalize(btn.textContent).includes("filtrar")
    );

    if (!filterButton) return;

    const selects = Array.from(document.querySelectorAll("select"));
    if (selects.length < 2) return;

    const [typeSelect, priceSelect, locationSelect] = selects;

    const cards = Array.from(document.querySelectorAll("article, div")).filter((el) => {
      const hasTitle = !!el.querySelector("h3");
      const hasImage = !!el.querySelector("img");
      const className = typeof el.className === "string" ? el.className : "";
      return hasTitle && hasImage && className.includes("group");
    });

    if (cards.length === 0) return;

    const applyFilters = () => {
      const typeValue = normalize(typeSelect?.value || "");
      const priceValue = priceSelect?.value || "";
      const locationValue = normalize(locationSelect?.value || "");

      let visibleCount = 0;

      cards.forEach((card) => {
        const text = normalize(card.textContent || "");
        const typeOk = !typeValue || typeValue.includes("todos") || text.includes(typeValue);
        const locationOk = !locationValue || locationValue.includes("todas") || text.includes(locationValue);
        const priceOk = priceInRange(getCardPrice(card), priceValue);

        const visible = typeOk && locationOk && priceOk;
        card.style.display = visible ? "" : "none";
        if (visible) visibleCount += 1;
      });

      showToast(`Mostrando ${visibleCount} propiedades`);
    };

    filterButton.addEventListener("click", (event) => {
      event.preventDefault();
      applyFilters();
    });
  };

  const readFormFields = (form) => {
    const values = [];
    const fields = form.querySelectorAll("input, textarea, select");

    fields.forEach((field) => {
      const value = (field.value || "").trim();
      if (!value) return;

      const labelText =
        field.closest("div")?.querySelector("label")?.textContent ||
        field.getAttribute("name") ||
        field.getAttribute("placeholder") ||
        field.getAttribute("type") ||
        "dato";

      values.push({ label: labelText.trim(), value });
    });

    return values;
  };

  const wireForms = () => {
    document.querySelectorAll("form").forEach((form) => {
      const sendToWhatsApp = () => {
        const title = document.title || "ASESPRO";
        const fields = readFormFields(form);
        const lines = [`Hola ASESPRO, envio esta consulta desde ${title}.`];

        if (fields.length === 0) {
          lines.push("Necesito que me contacten para recibir asesoramiento.");
        } else {
          fields.forEach((item) => lines.push(`- ${item.label}: ${item.value}`));
        }

        openWhatsApp(lines.join("\n"));
        showToast("Abrimos WhatsApp con tu consulta.");
      };

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        sendToWhatsApp();
      });

      form.querySelectorAll("button").forEach((button) => {
        if (normalize(button.textContent).includes("whatsapp")) {
          button.addEventListener("click", (event) => {
            event.preventDefault();
            sendToWhatsApp();
          });
        }
      });
    });
  };

  const updateMinorContent = () => {
    document.querySelectorAll("body").forEach((body) => {
      if (!body.classList.contains("font-body")) {
        body.classList.add("font-body");
      }
    });
  };

  const init = () => {
    wireNavLinks();
    wireAnchors();
    wireButtons();
    wireForms();
    initListingFilters();
    updateMinorContent();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
