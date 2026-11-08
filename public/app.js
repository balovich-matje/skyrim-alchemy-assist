/* Alchemy Assist — UI */
(function () {
  "use strict";
  const A = window.Alchemy;
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const LS_KEY = "alchemy-assist-state";
  const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

  let state = { inventory: {}, crafted: [], settings: Object.assign({}, A.DEFAULT_SETTINGS) };
  let server = false;        // talking to server.py?
  let ocrEngine = "tesseract";
  let plan = { steps: [], total: 0 };
  const stepEls = new Map(); // recipe key -> <li>
  const invEls = new Map();  // ingredient name -> <li>

  // ---------------- persistence ----------------
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const body = JSON.stringify(state);
      try { localStorage.setItem(LS_KEY, body); } catch (e) { /* storage unavailable */ }
      if (server) fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body }).catch(() => {});
    }, 250);
  }

  async function load() {
    try {
      const h = await fetch("/api/health", { cache: "no-store" });
      if (h.ok) { const j = await h.json(); server = true; ocrEngine = j.ocr === "vision" ? "vision" : "tesseract"; }
    } catch (e) { server = false; }
    let saved = null;
    if (server) { try { saved = await (await fetch("/api/state")).json(); } catch (e) { /* ignore */ } }
    if (!saved || !saved.inventory) { try { saved = JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (e) { saved = null; } }
    if (saved && saved.inventory) {
      state.inventory = saved.inventory;
      state.crafted = saved.crafted || [];
      state.settings = Object.assign({}, A.DEFAULT_SETTINGS, saved.settings || {});
    }
    // drop names that aren't in the data set anymore
    for (const n of Object.keys(state.inventory)) if (!A.BY_NAME.has(n)) delete state.inventory[n];
  }

  // ---------------- inventory helpers ----------------
  const avail = (n) => { const r = state.inventory[n]; return r ? Math.max(0, r.count - (r.used || 0)) : 0; };

  function applyFound(found) {
    const added = [], updated = [];
    for (const [name, count] of found) {
      const r = state.inventory[name];
      if (!r) { state.inventory[name] = { count, used: 0 }; added.push(name); continue; }
      // A screenshot is the truth — unless it shows exactly the old count (an older/duplicate screenshot).
      if (r.count !== count) {
        const before = avail(name);
        r.count = count; r.used = 0;
        if (before !== count) updated.push({ name, from: before, to: count });
      }
    }
    return { added, updated };
  }

  // ---------------- OCR ----------------
  async function ocrServer(file) {
    const r = await fetch("/api/ocr", { method: "POST", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "OCR failed");
    return j.lines;
  }

  let tessWorker = null;
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("could not load " + src)); document.head.appendChild(s); });
  }
  async function ocrBrowser(file) {
    if (!window.Tesseract) await loadScript(TESSERACT_URL);
    if (!tessWorker) tessWorker = await window.Tesseract.createWorker("eng");
    const bmp = await createImageBitmap(file);
    const scale = Math.min(3, Math.max(1, 2400 / bmp.width));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(bmp, 0, 0, c.width, c.height);
    // Skyrim text is light on a dark, noisy background: invert + threshold to dark text on white.
    const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const v = lum > 150 ? 0 : 255;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    g.putImageData(img, 0, 0);
    const { data } = await tessWorker.recognize(c);
    return (data.lines || []).map((l) => ({ text: l.text }));
  }

  async function runOcr(file) {
    if (ocrEngine === "vision") {
      try { return await ocrServer(file); } catch (e) { if (!/unavailable/.test(e.message)) throw e; ocrEngine = "tesseract"; }
    }
    return ocrBrowser(file);
  }

  // ---------------- uploads ----------------
  let queue = Promise.resolve();
  function handleFiles(files) {
    const imgs = [...files].filter((f) => /^image\//.test(f.type) || /\.(png|jpe?g|webp|bmp|gif|heic|tiff?)$/i.test(f.name || ""));
    if (!imgs.length) return toast("Those don't look like images.");
    imgs.sort((a, b) => (a.lastModified || 0) - (b.lastModified || 0)); // newest screenshot wins
    for (const f of imgs) {
      const card = el("div", "upload");
      const url = URL.createObjectURL(f);
      card.innerHTML = `<img alt="" src="${url}"><div><div class="u-name">${esc(f.name || "Pasted image")}</div><div class="u-res"><span class="spinner"></span>Reading…</div></div>`;
      const box = $("#uploads");
      box.prepend(card);
      while (box.children.length > 5) box.lastChild.remove();
      queue = queue.then(() => processFile(f, card));
    }
  }

  async function processFile(file, card) {
    const res = card.querySelector(".u-res");
    try {
      const lines = await runOcr(file);
      const found = A.parseOcr(lines);
      if (!found.size) {
        card.classList.add("err");
        res.textContent = "No ingredients recognised — is the ingredient list visible?";
        return;
      }
      const { added, updated } = applyFound(found);
      const bits = [`${found.size} found`];
      if (added.length) bits.push(`<span class="new">${added.length} new</span>`);
      if (updated.length) bits.push(`<span class="upd">${updated.length} updated</span>`);
      res.innerHTML = bits.join(" · ") + (updated.length ? `<div class="small muted">${updated.slice(0, 4).map((u) => `${esc(u.name)} ${u.from} → ${u.to}`).join(", ")}${updated.length > 4 ? "…" : ""}</div>` : "");
      res.title = [...found].map(([n, c]) => `${n} (${c})`).join("\n");
      save();
      refresh({ flashNew: added, flashUpd: updated.map((u) => u.name) });
    } catch (e) {
      card.classList.add("err");
      res.textContent = "Failed: " + e.message;
    }
  }

  // ---------------- plan ----------------
  const stepKey = (s) => s.ingredients.slice().sort().join("+");

  function computePlan() {
    const inv = new Map();
    for (const [n, r] of Object.entries(state.inventory)) if (!r.reserved) inv.set(n, avail(n));
    plan = A.plan(inv, state.settings);
  }

  function flaskSVG(poison) {
    const c = poison ? "var(--poison)" : "var(--potion)";
    return `<svg class="flask" viewBox="0 0 32 38" aria-hidden="true"><path d="M12 2h8v2h-1v8l8 14a4 4 0 0 1-3.5 6h-15A4 4 0 0 1 5 26l8-14V4h-1z" fill="rgba(0,0,0,.35)" stroke="var(--gold)" stroke-width="1.2"/><path class="liquid" d="M9.3 21h13.4l3 5.3a2.5 2.5 0 0 1-2.2 3.7H8.5a2.5 2.5 0 0 1-2.2-3.7z" fill="${c}" opacity=".85"/><circle cx="14" cy="25" r="1.1" fill="#fff" opacity=".6"/><circle cx="18" cy="23" r=".7" fill="#fff" opacity=".5"/></svg>`;
  }

  function effectText(e) {
    let t = esc(e.name);
    const parts = [];
    if (e.showMag && e.mag) parts.push(e.mag);
    if (e.showDur && e.dur) parts.push(e.dur + "s");
    if (parts.length) t += ` <span class="muted">${parts.join(" · ")}</span>`;
    return e.harmful ? `<span class="neg">${t}</span>` : t;
  }

  function fillStep(li, s, i) {
    li.className = "step " + (s.potion.poison ? "poison" : "potion") + (i === 0 ? " first" : "") + (li.classList.contains("entering") ? " entering" : "");
    li.dataset.key = stepKey(s);
    li._step = s;
    li.innerHTML = `
      <label class="check" title="Mark as brewed"><input type="checkbox" aria-label="Mark ${esc(s.potion.title)} as brewed"><span class="box"></span><svg viewBox="0 0 20 20"><path d="M4 10.5l4 4 8-9"/></svg></label>
      ${flaskSVG(s.potion.poison)}
      <div class="info">
        <div class="title">${esc(s.potion.title)}<span class="times">×${s.times}</span></div>
        <div class="effects">${s.potion.effects.map(effectText).join(" · ")}</div>
        <div class="ings">${s.ingredients.map((n) => `<span class="chip">${esc(n)}</span>`).join("")}</div>
      </div>
      <div class="val"><b>${fmt(s.potion.value)}<i class="coin"></i></b><span>${s.times > 1 ? "× " + s.times + " = " + fmt(s.potion.value * s.times) : "each"}</span></div>`;
  }

  function renderPlan(beforeLayout) {
    const list = $("#plan");
    const before = new Map();
    for (const [k, li] of stepEls) before.set(k, li.getBoundingClientRect().top);
    if (beforeLayout) beforeLayout();

    const keep = new Set();
    let ref = list.firstChild;
    plan.steps.forEach((s, i) => {
      const k = stepKey(s);
      keep.add(k);
      let li = stepEls.get(k);
      if (!li) {
        li = el("li", "step entering");
        li.addEventListener("animationend", (ev) => { if (ev.animationName === "rise") li.classList.remove("entering"); });
        stepEls.set(k, li);
      }
      fillStep(li, s, i);
      if (li === ref) ref = ref.nextSibling;
      else list.insertBefore(li, ref);
    });
    for (const [k, li] of stepEls) if (!keep.has(k)) { li.remove(); stepEls.delete(k); }

    // FLIP: glide surviving rows into their new spots
    for (const [k, li] of stepEls) {
      if (!before.has(k)) continue;
      const dy = before.get(k) - li.getBoundingClientRect().top;
      if (Math.abs(dy) > 1) li.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 480, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    $("#planEmpty").hidden = plan.steps.length > 0 || list.querySelector(".brewing") != null;
    const hasInv = Object.keys(state.inventory).length > 0;
    $("#planEmpty p").textContent = hasInv ? "Nothing left that combines. Gather more ingredients and upload a new screenshot." : "Upload a screenshot of your ingredients to see what to brew.";
    const potions = plan.steps.reduce((a, s) => a + s.times, 0);
    $("#planMeta").textContent = plan.steps.length ? `${potions} brews · ${fmt(plan.total)} septims total` : "";
  }

  // ---------------- inventory render ----------------
  function renderInventory(opts = {}) {
    const list = $("#inventory");
    const used = new Set(plan.steps.flatMap((s) => s.ingredients));
    const names = Object.keys(state.inventory).sort((a, b) => a.localeCompare(b));
    const keep = new Set(names);
    let ref = list.firstChild;
    for (const n of names) {
      const r = state.inventory[n];
      let li = invEls.get(n);
      if (!li) { li = buildInvRow(n); invEls.set(n, li); }
      const a = avail(n);
      li.classList.toggle("depleted", a === 0);
      li.classList.toggle("reserved", !!r.reserved);
      li.classList.toggle("unused", a > 0 && !r.reserved && !used.has(n));
      const cnt = li.querySelector(".cnt");
      if (!cnt.querySelector("input")) cnt.innerHTML = r.used > 0 ? `<s>${r.count}</s>${a}` : String(a);
      li.querySelector(".tag").textContent = r.reserved ? "kept" : a > 0 && !used.has(n) ? "spare" : "";
      li.querySelector(".lock").title = r.reserved ? "Allow in plan" : "Keep out of plan";
      if (li === ref) ref = ref.nextSibling; else list.insertBefore(li, ref);
      for (const [cls, arr] of [["flash-new", opts.flashNew], ["flash-upd", opts.flashUpd], ["consume", opts.consume]]) {
        if (arr && arr.includes(n)) { li.classList.remove(cls); void li.offsetWidth; li.classList.add(cls); }
      }
    }
    for (const [n, li] of invEls) if (!keep.has(n)) { li.remove(); invEls.delete(n); }
    const total = names.reduce((s, n) => s + avail(n), 0);
    $("#invCount").textContent = names.length ? `${names.length} kinds · ${total}` : "";
    const scrollTo = (opts.flashNew && opts.flashNew[0]) || (opts.flashUpd && opts.flashUpd[0]);
    if (scrollTo && invEls.get(scrollTo)) invEls.get(scrollTo).scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function buildInvRow(name) {
    const li = el("li", "inv");
    li.dataset.name = name;
    li.innerHTML = `<span class="nm"></span><span class="tag"></span><span class="cnt" title="Click to edit"></span>
      <span class="acts"><button class="icon-btn lock" aria-label="Keep out of plan">🔒</button><button class="icon-btn del" aria-label="Remove" title="Remove">✕</button></span>`;
    li.querySelector(".nm").textContent = name;
    li.querySelector(".nm").title = name + " — " + A.BY_NAME.get(name).effects.map((e) => A.EFFECTS[e.e].name).join(", ");
    li.querySelector(".lock").onclick = () => { const r = state.inventory[name]; r.reserved = !r.reserved; save(); refresh(); };
    li.querySelector(".del").onclick = () => { delete state.inventory[name]; save(); refresh(); };
    li.querySelector(".cnt").onclick = (ev) => {
      const cnt = ev.currentTarget;
      if (cnt.querySelector("input")) return;
      const inp = el("input"); inp.type = "number"; inp.min = 0; inp.value = avail(name);
      cnt.innerHTML = ""; cnt.appendChild(inp); inp.focus(); inp.select();
      const done = (commit) => {
        if (commit) { const v = Math.max(0, parseInt(inp.value, 10) || 0); const r = state.inventory[name]; r.count = v; r.used = 0; save(); }
        cnt.innerHTML = ""; refresh();
      };
      inp.onkeydown = (e) => { if (e.key === "Enter") done(true); if (e.key === "Escape") done(false); };
      inp.onblur = () => done(true);
    };
    return li;
  }

  // ---------------- summary / settings ----------------
  const shown = { plan: 0, brewed: 0 };
  function countTo(node, key, target) {
    const from = shown[key], t0 = performance.now(), dur = 700;
    shown[key] = target;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      node.textContent = fmt(from + (target - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function renderSummary() {
    const box = $("#summary");
    if (!box.children.length) box.innerHTML = `<div class="stat"><b id="sPlan">0</b><span>Plan value</span></div><div class="stat"><b id="sBrewed">0</b><span>Brewed so far</span></div>`;
    countTo($("#sPlan"), "plan", plan.total);
    countTo($("#sBrewed"), "brewed", state.crafted.reduce((a, c) => a + c.value * c.times, 0));
    const s = state.settings;
    $("#settingsBrief").textContent = `Skill ${s.skill} · Alchemist ${s.alchemist}/5${s.fortify ? ` · +${s.fortify}%` : ""}${["physician", "benefactor", "poisoner", "purity"].filter((k) => s[k]).map((k) => " · " + k[0].toUpperCase() + k.slice(1)).join("")}`;
  }

  function renderCrafted() {
    const ul = $("#crafted");
    ul.innerHTML = "";
    state.crafted.slice().reverse().forEach((c) => {
      const li = el("li");
      li.innerHTML = `<div><div>${esc(c.title)} <span class="muted">×${c.times}</span></div><div class="ci">${c.ingredients.map(esc).join(" + ")}</div></div><span class="cv">${fmt(c.value * c.times)}<i class="coin"></i></span><button class="icon-btn" title="Undo — put the ingredients back">↶</button>`;
      li.querySelector("button").onclick = () => {
        for (const n of c.ingredients) { const r = state.inventory[n]; if (r) r.used = Math.max(0, (r.used || 0) - c.times); }
        state.crafted = state.crafted.filter((x) => x !== c);
        save(); refresh({ flashUpd: c.ingredients });
      };
      ul.appendChild(li);
    });
    $("#craftedCount").textContent = state.crafted.length ? `(${state.crafted.length})` : "";
    $("#craftedBox").hidden = !state.crafted.length;
  }

  function refresh(opts = {}, beforeLayout) {
    computePlan();
    renderPlan(beforeLayout);
    renderInventory(opts);
    renderSummary();
    renderCrafted();
  }

  // ---------------- brewing (tick) ----------------
  function sparks(fromEl, count = 18) {
    const r = fromEl.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < count; i++) {
      const s = el("div", "spark");
      s.style.left = cx - 3 + "px"; s.style.top = cy - 3 + "px";
      document.body.appendChild(s);
      const ang = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 70;
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 20;
      const size = 0.6 + Math.random() * 1.2;
      s.animate([
        { transform: `translate(0,0) scale(${size})`, opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(${size * 0.6})`, opacity: 0.9, offset: 0.6 },
        { transform: `translate(${dx * 1.2}px,${dy * 1.2 - 30}px) scale(0)`, opacity: 0 },
      ], { duration: 650 + Math.random() * 450, easing: "cubic-bezier(.15,.7,.3,1)" }).onfinish = () => s.remove();
    }
  }

  function brew(li) {
    const s = li._step;
    if (!s || li.classList.contains("brewing")) return;
    stepEls.delete(li.dataset.key); // detach: the plan will be rebuilt without it
    li.classList.add("brewing");
    li.querySelector("input").disabled = true;
    sparks(li.querySelector(".check"));
    // highlight what's about to be consumed
    s.ingredients.forEach((n) => invEls.get(n) && invEls.get(n).classList.add("hl"));
    setTimeout(() => li.classList.add("leaving"), 650);
    setTimeout(() => {
      for (const n of s.ingredients) { const r = state.inventory[n]; if (r) r.used = (r.used || 0) + s.times; }
      state.crafted.push({ title: s.potion.title, ingredients: s.ingredients, times: s.times, value: s.potion.value, poison: s.potion.poison, at: Date.now() });
      s.ingredients.forEach((n) => invEls.get(n) && invEls.get(n).classList.remove("hl"));
      save();
      refresh({ consume: s.ingredients }, () => li.remove());
      toast(`Brewed ${s.times}× ${s.potion.title}`);
    }, 1200);
  }

  // ---------------- misc UI ----------------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function confirmBox(title, text, okLabel) {
    const d = $("#confirm");
    $("#confirmTitle").textContent = title; $("#confirmText").textContent = text; $("#confirmOk").textContent = okLabel;
    d.showModal();
    return new Promise((res) => d.addEventListener("close", () => res(d.returnValue === "ok"), { once: true }));
  }

  function bindSettings() {
    const s = state.settings;
    const ids = ["skill", "fortify", "alchemist", "physician", "benefactor", "poisoner", "purity", "seeker", "allowPoisons"];
    let t;
    for (const id of ids) {
      const inp = $("#" + id);
      if (inp.type === "checkbox") inp.checked = !!s[id]; else inp.value = s[id];
      inp.addEventListener("input", () => {
        s[id] = inp.type === "checkbox" ? inp.checked : Math.max(0, Number(inp.value) || 0);
        if (id === "skill") { s.skill = Math.min(100, Math.max(15, s.skill)); $("#skillOut").textContent = s.skill; }
        save();
        clearTimeout(t); t = setTimeout(() => refresh(), 90);
      });
    }
    $("#skillOut").textContent = s.skill;
    if (!Object.keys(state.inventory).length) $("#settingsBox").open = true;
  }

  function bindUI() {
    const dz = $("#dropzone"), fi = $("#fileInput");
    dz.addEventListener("click", () => fi.click());
    dz.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fi.click(); } });
    fi.addEventListener("change", () => { handleFiles(fi.files); fi.value = ""; });
    let depth = 0;
    window.addEventListener("dragenter", (e) => { e.preventDefault(); depth++; dz.classList.add("drag"); });
    window.addEventListener("dragleave", () => { if (--depth <= 0) { depth = 0; dz.classList.remove("drag"); } });
    window.addEventListener("dragover", (e) => e.preventDefault());
    window.addEventListener("drop", (e) => { e.preventDefault(); depth = 0; dz.classList.remove("drag"); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); });
    window.addEventListener("paste", (e) => {
      if (e.target.matches && e.target.matches("input")) return;
      const files = [...(e.clipboardData && e.clipboardData.files || [])];
      if (files.length) { e.preventDefault(); handleFiles(files); }
    });

    $("#plan").addEventListener("change", (e) => { if (e.target.matches(".check input") && e.target.checked) brew(e.target.closest(".step")); });
    $("#plan").addEventListener("mouseover", (e) => {
      const li = e.target.closest(".step");
      for (const x of invEls.values()) x.classList.toggle("hl", !!(li && li._step && li._step.ingredients.includes(x.dataset.name)));
    });
    $("#plan").addEventListener("mouseleave", () => { for (const x of invEls.values()) x.classList.remove("hl"); });

    const dl = $("#allIngredients");
    A.INGREDIENTS.forEach((i) => { const o = document.createElement("option"); o.value = i.name; dl.appendChild(o); });
    $("#addForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = A.BY_NAME.has($("#addName").value) ? $("#addName").value : A.matchName($("#addName").value);
      if (!name) return toast("Unknown ingredient");
      const c = Math.max(1, parseInt($("#addCount").value, 10) || 1);
      const r = state.inventory[name];
      if (r) { r.count = avail(name) + c; r.used = 0; } else state.inventory[name] = { count: c, used: 0 };
      $("#addName").value = ""; $("#addCount").value = 1;
      save(); refresh({ flashNew: [name] });
    });

    $("#clearBtn").addEventListener("click", async () => {
      if (!(await confirmBox("Start fresh?", "This clears every ingredient and the brewed log. Your character settings are kept.", "Clear everything"))) return;
      state.inventory = {}; state.crafted = [];
      $("#uploads").innerHTML = "";
      save(); refresh();
      toast("Satchel emptied");
    });

    if (!server) $("#shutdownBtn").hidden = true;
    $("#shutdownBtn").addEventListener("click", async () => {
      if (!(await confirmBox("Shut down the server?", "The local Alchemy Assist server will stop. Your ingredients are saved for next time.", "Shut down"))) return;
      clearTimeout(saveTimer);
      try { await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) }); } catch (e) { /* ignore */ }
      try { await fetch("/api/shutdown", { method: "POST" }); } catch (e) { /* server may close the socket */ }
      $("#offline").hidden = false;
    });
  }

  function showOcrNote() {
    const n = $("#ocrNote");
    if (ocrEngine === "vision") { n.hidden = true; return; }
    n.hidden = false;
    n.textContent = server
      ? "Using in-browser text recognition (slower). Install Xcode Command Line Tools for faster, more accurate macOS Vision OCR."
      : "Running without the local server: text recognition happens in your browser and data is saved in this browser only.";
  }

  load().then(() => {
    bindSettings();
    bindUI();
    showOcrNote();
    refresh();
  });
})();
