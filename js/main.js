// ===== Language toggle =====
function setLang(lang) {
  document.body.classList.remove("lang-ja", "lang-en");
  document.body.classList.add("lang-" + lang);
  document.documentElement.lang = lang;
  try { localStorage.setItem("site-lang", lang); } catch (e) {}
  var btn = document.getElementById("langBtn");
  if (btn) btn.textContent = lang === "ja" ? "English" : "日本語";
}

// ===== Theme (dark / light) toggle =====
function setTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  try { localStorage.setItem("site-theme", theme); } catch (e) {}
  var btn = document.getElementById("themeBtn");
  if (btn) {
    btn.textContent = theme === "light" ? "☾" : "☀";
    btn.setAttribute("aria-label", theme === "light" ? "ダークモードに切替" : "ライトモードに切替");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  var saved = "ja";
  try { saved = localStorage.getItem("site-lang") || "ja"; } catch (e) {}
  setLang(saved);

  var savedTheme = "light";
  try { savedTheme = localStorage.getItem("site-theme") || "light"; } catch (e) {}
  setTheme(savedTheme);

  var themeBtn = document.getElementById("themeBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      setTheme(document.body.classList.contains("light") ? "dark" : "light");
    });
  }

  var btn = document.getElementById("langBtn");
  if (btn) {
    btn.addEventListener("click", function () {
      var next = document.body.classList.contains("lang-ja") ? "en" : "ja";
      setLang(next);
    });
  }

  // ===== Email (assembled to avoid scrapers; displayed with "_at_" instead of "@") =====
  var el = document.getElementById("emailLink");
  if (el) {
    var addr = ["sasamoto.daiki.r6", "dc.tohoku.ac.jp"].join("_at_");
    el.removeAttribute("href");
    el.textContent = addr;
  }

  // ===== Panel switching (tab-style sections) =====
  var panels = document.querySelectorAll("section.panel");
  if (panels.length) {
    document.body.classList.add("has-panels");
    var activate = function () {
      var hash = (location.hash || "#home").slice(1);
      var target = document.getElementById(hash);
      var scrollTo = null;
      // deep link: an id inside a panel (e.g. a specific book card) activates its panel,
      // opens any collapsed <details> around it, and scrolls to it
      if (target && !target.classList.contains("panel")) {
        var panel = target.closest ? target.closest("section.panel") : null;
        if (panel) {
          scrollTo = target;
          var det = target.closest("details");
          while (det) {
            det.open = true;
            det = det.parentElement ? det.parentElement.closest("details") : null;
          }
          target = panel;
        } else {
          target = document.getElementById("home");
        }
      }
      if (!target) target = document.getElementById("home");
      panels.forEach(function (p) { p.classList.remove("active"); });
      if (target) target.classList.add("active");
      document.querySelectorAll(".nav-links a").forEach(function (a) {
        var href = a.getAttribute("href") || "";
        a.classList.toggle("current", href === "#" + (target ? target.id : ""));
      });
      if (scrollTo) {
        var el2 = scrollTo;
        setTimeout(function () { el2.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
      } else {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("hashchange", activate);
    activate();
  }

  // ===== Scroll reveal =====
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.1 });
  document.querySelectorAll(".reveal").forEach(function (el) {
    observer.observe(el);
  });
});
