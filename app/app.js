/* Leonida Trophy Guide — tracker logic. No network at runtime: it only reads data/trophies.json from its own server. */
(function () {
  "use strict";
  var STORAGE_KEY = "leonida-trophy-guide-v2";
  var DEMO_EARNED = [2, 3, 4, 8, 15, 16, 19, 21, 28, 35, 42, 52];
  var ROADMAP = [
    { stage: 1, title: "Story — Chapters 1 to 4, then the final mission", desc: "Play the story in order: the opening mission, Chapters 1-4, the six named missions, then the final mission (gold). Around 60 hours. Keep a manual save at the start of every chapter." },
    { stage: 2, title: "100% completion — the second gold", desc: "Attain 100% completion. Rockstar has not spelled out what it covers, so finish the story, all stranger strands, collectibles, activities and property, and follow the in-game completion counter." },
    { stage: 3, title: "Collectibles — cards, WAiNK, vehicles, meditation, exploration", desc: "3 card sets, WAiNK at 100 locations, 100 vehicles discovered, every meditation spot (18, including the missable Chapter 1 spot), and all 52 areas of Leonida explored." },
    { stage: 4, title: "Activities — stunts, races, ranges, strands and robberies", desc: "250 stunts, gold in all 42 Shooting Range challenges, a drone-race win at all 14 locations, 20 different races won, 8 stranger strands, 50 challenges, partner crimes, combat and robbery trophies." },
    { stage: 5, title: "Money and property — launder, spend, buy, register", desc: "Launder $250,000 in Marked Bills, spend $100,000 across all shops, buy all 8 garage properties, and register 10 vehicles to the Scooter Bros app." },
    { stage: 6, title: "Cleanup — missables, one-offs and the platinum", desc: "The five stranger finales, the unique-animal hunt, the VCIA departure, the Rhino, and the eight one-off hidden moments. Then the platinum pops: Vice Got a Price!" }
  ];

  var data = null;
  var earned = loadProgress();
  var openId = null;

  var els = {};
  ["search", "kindFilter", "gradeFilter", "spoilerToggle", "exportBtn", "importBtn", "importFile",
   "progressText", "platinumText", "progressFill", "countText", "roadmap", "missables", "list", "emptyText"
  ].forEach(function (id) { els[id] = document.getElementById(id); });

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return {};
      var out = {};
      Object.keys(parsed).forEach(function (k) { if (parsed[k]) out[k] = true; });
      return out;
    } catch (e) { return {}; }
  }

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(earned)); } catch (e) { /* storage full or blocked: progress stays in memory */ }
  }

  function earnedCount() {
    return data.trophies.filter(function (t) { return earned[t.id]; }).length;
  }

  function gradeLabel(grade) {
    return grade.charAt(0).toUpperCase() + grade.slice(1);
  }

  function isSpoilerHidden(t) {
    return els.spoilerToggle.checked && t.kind === "story" && !earned[t.id];
  }

  function trophyMatches(t) {
    var q = els.search.value.trim().toLowerCase();
    if (q) {
      var hay = (t.name + " " + t.description + " " + t.guide + " " + (t.missable_note || "")).toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    var kind = els.kindFilter.value;
    if (kind === "missable") { if (!t.missable) return false; }
    else if (kind !== "all") { if (t.kind !== kind) return false; }
    var grade = els.gradeFilter.value;
    if (grade !== "all" && t.grade !== grade) return false;
    return true;
  }

  function renderProgress() {
    var n = earnedCount();
    var total = data.trophies.length;
    var pct = Math.round((n / total) * 100);
    els.progressText.textContent = n + " / " + total + " earned";
    els.platinumText.textContent = "Platinum: " + pct + "%";
    els.progressFill.style.width = pct + "%";
  }

  function trophyCard(t) {
    var card = document.createElement("article");
    card.className = "trophy" + (earned[t.id] ? " earned" : "");
    card.id = "trophy-" + t.id;
    var top = document.createElement("div");
    top.className = "trophy-top";
    var check = document.createElement("input");
    check.type = "checkbox";
    check.className = "trophy-check";
    check.checked = !!earned[t.id];
    check.setAttribute("aria-label", "Mark " + t.name + " as earned");
    check.addEventListener("change", function () {
      if (check.checked) earned[t.id] = true; else delete earned[t.id];
      saveProgress();
      renderAll();
    });
    var main = document.createElement("div");
    main.className = "trophy-main";
    var nameEl = document.createElement("div");
    nameEl.className = "trophy-name";
    var descEl = document.createElement("div");
    descEl.className = "trophy-desc";
    if (isSpoilerHidden(t)) {
      nameEl.textContent = "Hidden story trophy — earn it to reveal";
      nameEl.classList.add("spoiler-hidden");
      descEl.textContent = "A story trophy. Its name and description stay hidden until you earn it.";
    } else {
      nameEl.textContent = t.name;
      descEl.textContent = t.description;
    }
    var tags = document.createElement("div");
    tags.className = "trophy-tags";
    var badge = document.createElement("span");
    badge.className = "badge " + t.grade;
    badge.textContent = gradeLabel(t.grade);
    tags.appendChild(badge);
    var kindTag = document.createElement("span");
    kindTag.className = "tag";
    kindTag.textContent = t.kind;
    tags.appendChild(kindTag);
    if (t.hidden) {
      var hiddenTag = document.createElement("span");
      hiddenTag.className = "tag hidden-tag";
      hiddenTag.textContent = "Hidden";
      tags.appendChild(hiddenTag);
    }
    if (t.missable) {
      var missTag = document.createElement("span");
      missTag.className = "tag missable";
      missTag.textContent = "Missable";
      tags.appendChild(missTag);
    }
    main.appendChild(nameEl);
    main.appendChild(descEl);
    main.appendChild(tags);
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "detail-toggle";
    toggle.textContent = openId === t.id ? "Hide guide" : "Show guide";
    toggle.addEventListener("click", function () {
      openId = openId === t.id ? null : t.id;
      renderAll();
    });
    top.appendChild(check);
    top.appendChild(main);
    top.appendChild(toggle);
    card.appendChild(top);
    if (openId === t.id) card.appendChild(trophyDetail(t));
    return card;
  }

  function trophyDetail(t) {
    var detail = document.createElement("div");
    detail.className = "trophy-detail";
    var h = document.createElement("h3");
    h.textContent = "Guide";
    detail.appendChild(h);
    var p = document.createElement("p");
    p.textContent = t.guide;
    detail.appendChild(p);
    if (t.missable && t.missable_note) {
      var miss = document.createElement("p");
      miss.innerHTML = "";
      var strong = document.createElement("strong");
      strong.textContent = "Missable: ";
      miss.appendChild(strong);
      miss.appendChild(document.createTextNode(t.missable_note));
      detail.appendChild(miss);
    }
    var sh = document.createElement("h3");
    sh.textContent = "Sources";
    detail.appendChild(sh);
    var ul = document.createElement("ul");
    ul.className = "sources";
    t.sources.forEach(function (s) {
      var li = document.createElement("li");
      li.textContent = s;
      ul.appendChild(li);
    });
    detail.appendChild(ul);
    return detail;
  }

  function renderList() {
    els.list.innerHTML = "";
    var shown = data.trophies.filter(trophyMatches);
    shown.forEach(function (t) { els.list.appendChild(trophyCard(t)); });
    els.emptyText.hidden = shown.length !== 0;
    els.countText.textContent = "Showing " + shown.length + " of " + data.trophies.length + " trophies.";
  }

  function renderRoadmap() {
    els.roadmap.innerHTML = "";
    ROADMAP.forEach(function (stage) {
      var li = document.createElement("li");
      var head = document.createElement("div");
      head.className = "stage-head";
      var num = document.createElement("span");
      num.className = "stage-num";
      num.textContent = "Stage " + stage.stage;
      var title = document.createElement("span");
      title.className = "stage-title";
      title.textContent = stage.title;
      head.appendChild(num);
      head.appendChild(title);
      var desc = document.createElement("p");
      desc.className = "stage-desc";
      desc.textContent = stage.desc;
      var chips = document.createElement("div");
      chips.className = "stage-trophies";
      data.trophies.filter(function (t) { return t.stage === stage.stage; }).forEach(function (t) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip" + (earned[t.id] ? " done" : "");
        chip.textContent = (earned[t.id] ? "✓ " : "") + t.name;
        chip.addEventListener("click", function () {
          openId = t.id;
          renderAll();
          var card = document.getElementById("trophy-" + t.id);
          if (card) card.scrollIntoView({ block: "center" });
        });
        chips.appendChild(chip);
      });
      li.appendChild(head);
      li.appendChild(desc);
      li.appendChild(chips);
      els.roadmap.appendChild(li);
    });
  }

  function renderMissables() {
    els.missables.innerHTML = "";
    data.trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
      var li = document.createElement("li");
      var strong = document.createElement("strong");
      strong.textContent = t.name + " — ";
      li.appendChild(strong);
      li.appendChild(document.createTextNode(t.missable_note || "One-shot moment; keep a manual save."));
      els.missables.appendChild(li);
    });
  }

  function renderAll() {
    renderProgress();
    renderRoadmap();
    renderMissables();
    renderList();
  }

  function exportProgress() {
    var payload = {
      guide: "Leonida Trophy Guide",
      version: 2,
      exported_at: new Date().toISOString(),
      earned: data.trophies.filter(function (t) { return earned[t.id]; }).map(function (t) { return t.id; })
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "leonida-trophy-progress.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function importProgress(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        if (!parsed || !Array.isArray(parsed.earned)) throw new Error("not a progress file");
        var next = {};
        parsed.earned.forEach(function (id) {
          if (typeof id === "number" && id >= 1 && id <= data.trophies.length) next[id] = true;
        });
        earned = next;
        saveProgress();
        renderAll();
        els.countText.textContent = "Imported progress: " + Object.keys(next).length + " trophies earned.";
      } catch (e) {
        els.countText.textContent = "Import failed: that file is not a valid Leonida Trophy Guide progress file.";
      }
    };
    reader.readAsText(file);
  }

  function applyDemo() {
    DEMO_EARNED.forEach(function (id) { earned[id] = true; });
    saveProgress();
  }

  function applyDeepLinks() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") applyDemo();
    var kind = params.get("kind");
    if (kind && ["all", "story", "missable", "collectibles", "activities", "online"].indexOf(kind) >= 0) els.kindFilter.value = kind;
    var grade = params.get("grade");
    if (grade && ["all", "platinum", "gold", "silver", "bronze"].indexOf(grade) >= 0) els.gradeFilter.value = grade;
    var spoiler = params.get("spoiler");
    if (spoiler === "0") els.spoilerToggle.checked = false;
    if (spoiler === "1") els.spoilerToggle.checked = true;
    var q = params.get("q");
    if (q) els.search.value = q;
    var trophy = parseInt(params.get("trophy") || "", 10);
    if (trophy >= 1 && trophy <= data.trophies.length) openId = trophy;
  }

  function init() {
    els.search.addEventListener("input", renderList);
    els.kindFilter.addEventListener("change", renderList);
    els.gradeFilter.addEventListener("change", renderList);
    els.spoilerToggle.addEventListener("change", renderList);
    els.exportBtn.addEventListener("click", exportProgress);
    els.importBtn.addEventListener("click", function () { els.importFile.click(); });
    els.importFile.addEventListener("change", function () {
      importProgress(els.importFile.files[0]);
      els.importFile.value = "";
    });
    fetch("data/trophies.json")
      .then(function (res) {
        if (!res.ok) throw new Error("trophies.json missing");
        return res.json();
      })
      .then(function (json) {
        data = json;
        applyDeepLinks();
        renderAll();
        if (openId) {
          var card = document.getElementById("trophy-" + openId);
          if (card) card.scrollIntoView({ block: "center" });
        }
        var section = new URLSearchParams(window.location.search).get("section");
        if (section && ["roadmap", "missables", "list"].indexOf(section) >= 0) {
          var target = document.getElementById(section);
          if (target) target.scrollIntoView({ block: "start" });
        }
      })
      .catch(function () {
        els.countText.textContent = "Could not load data/trophies.json. Serve app/ over HTTP and reload.";
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
