(function () {
  "use strict";

  function setStand() {
    var el = document.querySelector(".lastUpdate span");
    if (el) el.textContent = new Date().toLocaleString("de-DE");
  }

  function getBadgeColor(type) {
    switch ((type.split(" ")[0] || "").toLowerCase()) {
      case "buch":
        return "#fcd5aeff";
      case "artikel":
      case "gruppenunterricht":
        return "#d4ffd7ff";
      case "einzelunterricht":
        return "#b6e7f8ff";
      default:
        return "#c1c1c1ff";
    }
  }

  function stripHtml(html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || "";
  }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        if (key === "style") {
          Object.assign(node.style, props[key]);
        } else if (key === "html") {
          node.innerHTML = props[key];
        } else {
          node.setAttribute(key, props[key]);
        }
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function normalizeItem(raw) {
    return {
      titelHtml: String(raw.title),
      year: typeof raw.year === "number" ? raw.year : undefined,
      end: typeof raw.end === "number" ? raw.end : undefined,
      image: raw.image ? "/images/" + raw.image : undefined,
      type: raw.type != null ? raw.type : "",
      link: raw.link != null ? raw.link : "",
    };
  }

  // -- item renderers -----------------------------------------------------

  function renderArticleEntry(item) {
    var head = el("div", null, [
      item.type
        ? el(
            "span",
            {
              class: "typeStyle",
              style: { backgroundColor: getBadgeColor(item.type) },
            },
            [document.createTextNode(item.type)]
          )
        : null,
      item.year != null
        ? el("span", { style: { fontSize: "12px", opacity: ".7" } }, [
            document.createTextNode(String(item.year)),
          ])
        : null,
    ]);

    var titleNode = el("span", { html: item.titelHtml, style: { display: "inline" } });
    var body = item.link
      ? el("a", { href: item.link, target: "_blank", rel: "noopener" }, [titleNode])
      : titleNode;

    return el("article", { class: "articleEntry" }, [head, body]);
  }

  function renderMusikEntry(item) {
    var imgLink = el("a", { href: item.link, target: "_blank", rel: "noopener" }, [
      el("img", {
        src: item.image,
        width: "200",
        height: "200",
        loading: "lazy",
        alt: stripHtml(item.titelHtml),
      }),
    ]);
    var meta = el("div", null, [
      el("div", { html: item.titelHtml }),
      el("div", null, [document.createTextNode(item.type + " | " + item.year)]),
    ]);
    return el("article", { class: "altArticleEntry" }, [el("div", null, [imgLink]), meta]);
  }

  function renderVitaEntry(item) {
    var yearSpan =
      item.year != null
        ? el(
            "span",
            { style: { display: "inline-block", minWidth: "100px", fontSize: "12px", fontWeight: "bold" } },
            [document.createTextNode(item.year + (item.end != null ? "–" + item.end : ""))]
          )
        : null;

    var titleNode = el("span", { html: item.titelHtml, style: { display: "inline" } });
    var body = item.link
      ? el("a", { href: item.link, target: "_blank", rel: "noopener" }, [titleNode])
      : titleNode;

    return el("article", { class: "altArticleEntry" }, [el("div", null, [yearSpan]), el("div", null, [body])]);
  }

  function renderVortraegeEntry(item) {
    var yearSpan =
      item.year != null
        ? el(
            "span",
            { style: { display: "inline-block", minWidth: "100px", fontSize: "12px", fontWeight: "bold" } },
            [document.createTextNode(item.year + " | " + item.type)]
          )
        : null;

    var titleNode = el("span", { html: item.titelHtml, style: { display: "inline" } });
    var body = item.link
      ? el("a", { href: item.link, target: "_blank", rel: "noopener" }, [titleNode])
      : titleNode;

    return el("article", { class: "altArticleEntry" }, [el("div", null, [yearSpan]), el("div", null, [body])]);
  }

  // -- page configs ---------------------------------------------------------

  var PAGES = {
    musik: {
      dataFile: "/data/musik.json",
      errorMsg: "Der Lebenslauf konnte nicht geladen werden.",
      render: function (items, list) {
        items.forEach(function (item) {
          list.appendChild(renderMusikEntry(item));
        });
      },
    },
    lehre: {
      dataFile: "/data/lehre.json",
      errorMsg: "Die Unterrichtsangebote konnten nicht geladen werden.",
      render: function (items, list) {
        list.classList.add("container");
        items.forEach(function (item, i) {
          if (i === 0 || item.year !== items[i - 1].year) {
            list.appendChild(el("h2", { class: "break" }, [document.createTextNode(String(item.year))]));
          }
          list.appendChild(renderArticleEntry(item));
        });
      },
    },
    publikationen: {
      dataFile: "/data/publikationen.json",
      errorMsg: "Die Publikationen konnten nicht geladen werden.",
      render: function (items, list) {
        items.forEach(function (item) {
          list.appendChild(renderArticleEntry(item));
        });
      },
    },
    vita: {
      dataFile: "/data/vita.json",
      errorMsg: "Der Lebenslauf konnte nicht geladen werden.",
      render: function (items, list) {
        items.forEach(function (item) {
          list.appendChild(renderVitaEntry(item));
        });
      },
    },
    vortraege: {
      dataFile: "/data/vortraege.json",
      errorMsg: "Der Lebenslauf konnte nicht geladen werden.",
      render: function (items, list) {
        items.forEach(function (item) {
          list.appendChild(renderVortraegeEntry(item));
        });
      },
    },
  };

  function loadPageData(pageKey) {
    var config = PAGES[pageKey];
    if (!config) return;

    var loading = document.getElementById("state-loading");
    var empty = document.getElementById("state-empty");
    var error = document.getElementById("state-error");
    var list = document.getElementById("list");

    fetch(config.dataFile + "?ts=" + Date.now(), { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status + " " + res.statusText);
        return res.json();
      })
      .then(function (raw) {
        var items = (Array.isArray(raw) ? raw : []).map(normalizeItem);
        items.sort(function (a, b) {
          return (b.year || 0) - (a.year || 0);
        });

        loading.hidden = true;

        if (items.length === 0) {
          empty.hidden = false;
          return;
        }

        config.render(items, list);
      })
      .catch(function (err) {
        console.error(err);
        loading.hidden = true;
        error.hidden = false;
        error.textContent = config.errorMsg;
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setStand();
    var page = document.body.getAttribute("data-page");
    if (page) loadPageData(page);
  });
})();
