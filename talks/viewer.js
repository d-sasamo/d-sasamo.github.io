/* =====================================================================
   Talks & Posters — 閲覧専用ビューア
   使い方（各 talks/<item>/index.html 側）:
     スライド: <div id="viewer" data-kind="slides" data-base="s" data-ext="webp" data-pad="2" data-count="24">
               → s01.webp … s24.webp を順に表示
     ポスター: <div id="viewer" data-kind="poster" data-src="poster.webp">
   ===================================================================== */
(function () {
  var v = document.getElementById("viewer");
  if (!v) return;
  var kind = v.getAttribute("data-kind") || "slides";
  var stage = document.getElementById("stage");
  var img = document.getElementById("stageImg");
  var shield = document.getElementById("shield");
  var prev = document.getElementById("prevBtn");
  var next = document.getElementById("nextBtn");
  var now = document.getElementById("pageNow");
  var tot = document.getElementById("pageTotal");
  var fsNow = document.getElementById("fsNow");
  var thumbs = document.getElementById("thumbs");
  var fsBtn = document.getElementById("fsBtn");
  var fsClose = document.getElementById("fsClose");
  var zoomBtn = document.getElementById("zoomBtn");

  // ---- 抑止: 右クリック・ドラッグ（スクリーンショットは防げないが、保存操作の導線は出さない）
  ["contextmenu", "dragstart"].forEach(function (ev) {
    stage.addEventListener(ev, function (e) { e.preventDefault(); });
    if (thumbs) thumbs.addEventListener(ev, function (e) { e.preventDefault(); });
  });

  // ---- 全画面（iOS Safari は要素の requestFullscreen 非対応 → 擬似全画面）
  var isFs = function () { return document.fullscreenElement === stage || stage.classList.contains("fsfake"); };
  var enterFs = function () {
    if (stage.requestFullscreen) {
      stage.requestFullscreen().catch(function () { stage.classList.add("fsfake"); document.body.classList.add("fs-lock"); });
    } else if (stage.webkitRequestFullscreen) {
      stage.webkitRequestFullscreen();
    } else {
      stage.classList.add("fsfake"); document.body.classList.add("fs-lock");
    }
    stage.focus();
  };
  var exitFs = function () {
    if (document.fullscreenElement) { document.exitFullscreen(); }
    else if (document.webkitFullscreenElement && document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
    stage.classList.remove("fsfake"); document.body.classList.remove("fs-lock");
  };
  if (fsBtn) fsBtn.addEventListener("click", function () { isFs() ? exitFs() : enterFs(); });
  if (fsClose) fsClose.addEventListener("click", exitFs);

  if (kind === "slides") {
    var n = parseInt(v.getAttribute("data-count"), 10) || 1;
    var base = v.getAttribute("data-base") || "s";
    var ext = v.getAttribute("data-ext") || "webp";
    var pad = parseInt(v.getAttribute("data-pad") || "2", 10);
    var cur = 0;
    var src = function (i) { var s = String(i); while (s.length < pad) s = "0" + s; return base + s + "." + ext; };
    var preload = function (i) { if (i >= 1 && i <= n) { var im = new Image(); im.src = src(i); } };
    var tEls = [];

    var show = function (i, keepHash) {
      i = Math.min(n, Math.max(1, i));
      if (i === cur) return;
      cur = i;
      img.src = src(cur);
      img.alt = "Slide " + cur + " / " + n;
      if (now) now.textContent = cur;
      if (fsNow) fsNow.textContent = cur + " / " + n;
      if (prev) prev.disabled = cur === 1;
      if (next) next.disabled = cur === n;
      tEls.forEach(function (t, k) {
        t.classList.toggle("on", k + 1 === cur);
      });
      if (tEls[cur - 1] && tEls[cur - 1].scrollIntoView) {
        tEls[cur - 1].scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      }
      if (!keepHash && history.replaceState) history.replaceState(null, "", "#" + cur);
      preload(cur + 1); preload(cur - 1);
    };

    if (tot) tot.textContent = n;
    if (thumbs) {
      for (var k = 1; k <= n; k++) {
        (function (k) {
          var t = document.createElement("img");
          t.src = src(k); t.alt = "Slide " + k; t.loading = "lazy"; t.draggable = false;
          t.addEventListener("click", function () { show(k); });
          thumbs.appendChild(t); tEls.push(t);
        })(k);
      }
    }
    if (prev) prev.addEventListener("click", function (e) { e.stopPropagation(); show(cur - 1); });
    if (next) next.addEventListener("click", function (e) { e.stopPropagation(); show(cur + 1); });

    // クリック: 左 35% で戻る、それ以外で進む
    shield.addEventListener("click", function (e) {
      var r = stage.getBoundingClientRect();
      (e.clientX - r.left) < r.width * 0.35 ? show(cur - 1) : show(cur + 1);
    });
    // スワイプ
    var tx = null, ty = null;
    shield.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    shield.addEventListener("touchend", function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      tx = ty = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault(); dx < 0 ? show(cur + 1) : show(cur - 1);
      }
    });
    // キーボード
    document.addEventListener("keydown", function (e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      switch (e.key) {
        case "ArrowRight": case "PageDown": case " ": e.preventDefault(); show(cur + 1); break;
        case "ArrowLeft": case "PageUp": e.preventDefault(); show(cur - 1); break;
        case "Home": e.preventDefault(); show(1); break;
        case "End": e.preventDefault(); show(n); break;
        case "f": case "F": isFs() ? exitFs() : enterFs(); break;
        case "Escape": if (stage.classList.contains("fsfake")) exitFs(); break;
      }
    });
    var h = parseInt((location.hash || "").slice(1), 10);
    show(isNaN(h) ? 1 : h, true);
  } else {
    // ---- poster
    img.src = v.getAttribute("data-src");
    img.alt = v.getAttribute("data-alt") || "Poster";
    var setZoomLabel = function () {
      if (!zoomBtn) return;
      var z = stage.classList.contains("zoom");
      zoomBtn.querySelector(".ja").textContent = z ? "全体を表示" : "拡大（幅いっぱい）";
      zoomBtn.querySelector(".en").textContent = z ? "Fit to screen" : "Zoom (fit width)";
    };
    var toggleZoom = function () {
      stage.classList.toggle("zoom");
      if (!stage.classList.contains("zoom")) stage.scrollTop = 0;
      setZoomLabel();
    };
    if (zoomBtn) zoomBtn.addEventListener("click", toggleZoom);
    shield.addEventListener("click", toggleZoom);
    document.addEventListener("keydown", function (e) {
      if (e.key === "f" || e.key === "F") { isFs() ? exitFs() : enterFs(); }
      if (e.key === "Escape" && stage.classList.contains("fsfake")) exitFs();
      if (e.key === "z" || e.key === "Z") toggleZoom();
    });
    setZoomLabel();
  }
})();
