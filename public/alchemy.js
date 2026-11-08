// Alchemy engine: potion strength/value formulas (UESP "Skyrim:Alchemy Effects"),
// screenshot text -> ingredient matching, and the crafting-plan optimizer.
// Works in the browser (window.Alchemy) and in Node (module.exports) for testing.
(function (root) {
  "use strict";
  const DATA = root.ALCHEMY_DATA || (typeof require !== "undefined" ? loadNodeData() : null);

  function loadNodeData() {
    const fs = require("fs"), path = require("path");
    const txt = fs.readFileSync(path.join(__dirname, "data.js"), "utf8");
    return JSON.parse(txt.slice(txt.indexOf("=") + 1).trim().replace(/;$/, ""));
  }

  const EFFECTS = DATA.effects;
  const INGREDIENTS = DATA.ingredients;
  const BY_NAME = new Map(INGREDIENTS.map((i) => [i.name, i]));
  const RESTORE = new Set(["Restore Health", "Restore Magicka", "Restore Stamina"]);

  // Effect bitmasks (59 effects -> two 32-bit words).
  INGREDIENTS.forEach((ing) => {
    ing.lo = 0; ing.hi = 0;
    ing.byEffect = {};
    ing.effects.forEach((e) => {
      if (e.e < 32) ing.lo |= 1 << e.e; else ing.hi |= 1 << (e.e - 32);
      ing.byEffect[e.e] = e;
    });
  });

  const DEFAULT_SETTINGS = {
    skill: 15, fortify: 0, alchemist: 0, physician: false, benefactor: false,
    poisoner: false, purity: false, seeker: false, allowPoisons: true,
  };

  function basePower(s) {
    return 4 * (1 + s.skill / 200) * (1 + s.fortify / 100) * (1 + (s.alchemist * 20) / 100) * (s.seeker ? 1.1 : 1);
  }

  // Compute the strength of one effect given its controlling ingredient entry.
  function effectStrength(effIdx, entry, power) {
    const E = EFFECTS[effIdx];
    let mag = E.mag * (entry.m || 1);
    let dur = E.dur * (entry.d == null ? 1 : entry.d);
    if (E.varies === "magnitude") mag = Math.round(mag * power); else mag = Math.round(mag);
    if (E.varies === "duration") dur = Math.round(dur * power); else dur = Math.round(dur);
    const mf = mag > 0 ? mag : 1;
    const df = dur > 0 ? dur / 10 : 1;
    const value = Math.floor(E.cost * Math.pow(mf * df, 1.1) * (entry.h || 1));
    return { mag, dur, value };
  }

  // Evaluate a combination of 2-3 ingredient objects. Returns null if nothing combines.
  function brew(ings, settings) {
    const s = settings || DEFAULT_SETTINGS;
    // effects present in at least two ingredients
    const shared = [];
    for (let e = 0; e < EFFECTS.length; e++) {
      let holders = 0, best = null;
      for (const ing of ings) {
        const entry = ing.byEffect[e];
        if (entry) { holders++; if (!best || entry.p < best.p) best = entry; }
      }
      if (holders >= 2) shared.push({ e, entry: best });
    }
    if (!shared.length) return null;
    // every ingredient must contribute something
    for (const ing of ings) if (!shared.some((x) => ing.byEffect[x.e])) return null;

    const p0 = basePower(s);
    // Strongest effect (before Benefactor/Poisoner) decides potion vs poison.
    let strongest = null;
    for (const x of shared) {
      const pw = p0 * (s.physician && RESTORE.has(EFFECTS[x.e].name) ? 1.25 : 1);
      const v = effectStrength(x.e, x.entry, pw).value;
      if (!strongest || v > strongest.v) strongest = { e: x.e, v };
    }
    const poison = EFFECTS[strongest.e].harmful;
    if (poison && !s.allowPoisons) return null;

    const effects = [];
    let value = 0;
    for (const x of shared) {
      const E = EFFECTS[x.e];
      if (s.purity && E.harmful !== poison) continue;
      let pw = p0;
      if (s.physician && RESTORE.has(E.name)) pw *= 1.25;
      if (s.benefactor && !poison && !E.harmful) pw *= 1.25;
      else if (s.poisoner && poison && E.harmful) pw *= 1.25;
      const st = effectStrength(x.e, x.entry, pw);
      effects.push({ name: E.name, harmful: E.harmful, mag: st.mag, dur: st.dur, value: st.value, showMag: E.mag > 0, showDur: E.dur > 0 && !["Restore Health","Restore Magicka","Restore Stamina","Cure Disease","Cure Poison","Damage Magicka","Damage Stamina","Damage Health"].includes(E.name) && !E.name.startsWith("Ravage") });
      value += st.value;
    }
    effects.sort((a, b) => b.value - a.value);
    const title = (poison ? "Poison of " : "Potion of ") + EFFECTS[strongest.e].name;
    return { poison, title, value, effects };
  }

  // ---------- Text matching ----------
  const norm = (s) => s.toLowerCase().replace(/[’`´]/g, "'").replace(/[^a-z' ]+/g, " ").replace(/\s+/g, " ").trim();
  const NORM_NAMES = INGREDIENTS.map((i) => ({ n: norm(i.name), name: i.name }));

  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    let prev = new Array(n + 1), cur = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      [prev, cur] = [cur, prev];
    }
    return prev[n];
  }

  function matchName(raw) {
    const t = norm(raw);
    if (t.length < 3) return null;
    let best = null, bestD = Infinity, second = Infinity;
    for (const c of NORM_NAMES) {
      if (Math.abs(c.n.length - t.length) > 3) continue;
      const d = lev(t, c.n);
      if (d < bestD) { second = bestD; bestD = d; best = c.name; } else if (d < second) second = d;
    }
    const tol = t.length <= 4 ? 0 : t.length <= 8 ? 1 : Math.floor(t.length * 0.15);
    if (bestD <= tol && second > bestD) return best;
    return null;
  }

  const fixDigits = (s) => s.replace(/[oO]/g, "0").replace(/[lIi|!]/g, "1").replace(/[sS]/g, "5").replace(/[bб]/g, "6").replace(/[^0-9]/g, "");

  // Parse one OCR line (may contain the whole row, e.g. "Wheat (18) Ingredient 0.1 5 50").
  function parseLine(text) {
    let s = text.replace(/\s+/g, " ").trim();
    if (!s) return null;
    // The name region ends at the first "(N)", the "Ingredient" type column, or a numeric column.
    // (A whole merged row may also contain the detail panel, e.g. "... 40 BLISTERWORT (7)".)
    const m = s.match(/^(.*?)(?:\s*[\(\[{]\s*([0-9oOlIi|!sSbб]{1,4})\s*[\)\]}]|\s+ingr\w*\b|\s+[-\d][\d.,]*(?=\s|$)|$)/i);
    const namePart = m[1];
    let count = 1;
    if (m[2]) { const n = parseInt(fixDigits(m[2]), 10); if (n > 0) count = n; }
    const words = namePart.split(" ");
    for (let k = Math.min(words.length, 5); k >= 1; k--) {
      const name = matchName(words.slice(0, k).join(" "));
      if (name) return { name, count };
    }
    return null;
  }

  // OCR result -> Map(name -> count)
  function parseOcr(lines) {
    const found = new Map();
    for (const l of lines) {
      const r = parseLine(l.text || "");
      if (r) found.set(r.name, Math.max(found.get(r.name) || 0, r.count));
    }
    return found;
  }

  // ---------- Optimizer ----------
  // inv: Map(name -> available count). Returns { steps:[{ingredients, times, potion}], total }
  function plan(inv, settings) {
    const s = Object.assign({}, DEFAULT_SETTINGS, settings || {});
    const avail = [...inv].filter(([n, c]) => c > 0 && BY_NAME.has(n)).map(([n]) => BY_NAME.get(n));
    const N = avail.length;
    const recipes = [];
    const pairVal = new Map();
    const shares = (a, b) => (a.lo & b.lo) !== 0 || (a.hi & b.hi) !== 0;

    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      if (!shares(avail[i], avail[j])) continue;
      const p = brew([avail[i], avail[j]], s);
      if (!p || p.value <= 0) continue;
      pairVal.set(i * 1000 + j, p.value);
      recipes.push({ idx: [i, j], potion: p, value: p.value });
    }
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) for (let k = j + 1; k < N; k++) {
      const a = avail[i], b = avail[j], c = avail[k];
      const ab = shares(a, b), ac = shares(a, c), bc = shares(b, c);
      if (!((ab || ac) && (ab || bc) && (ac || bc))) continue;
      const p = brew([a, b, c], s);
      if (!p || p.value <= 0) continue;
      const sub = Math.max(pairVal.get(i * 1000 + j) || 0, pairVal.get(i * 1000 + k) || 0, pairVal.get(j * 1000 + k) || 0);
      if (p.value <= sub) continue; // a pair does at least as well with fewer ingredients
      recipes.push({ idx: [i, j, k], potion: p, value: p.value });
    }

    const counts0 = avail.map((a) => inv.get(a.name));
    let best = null;
    for (const alpha of [0, 0.35, 0.7, 1, 1.4]) {
      const sorted = recipes.slice().sort((x, y) => y.value / Math.pow(x.idx.length, alpha) - x.value / Math.pow(y.idx.length, alpha) || y.value - x.value);
      const counts = counts0.slice();
      const steps = [];
      let total = 0;
      for (const r of sorted) {
        let t = Infinity;
        for (const i of r.idx) t = Math.min(t, counts[i]);
        if (t <= 0) continue;
        for (const i of r.idx) counts[i] -= t;
        steps.push({ ingredients: r.idx.map((i) => avail[i].name), times: t, potion: r.potion });
        total += t * r.value;
      }
      if (!best || total > best.total) best = { steps, total };
    }
    if (!best) best = { steps: [], total: 0 };
    best.steps.sort((a, b) => b.potion.value - a.potion.value || b.times - a.times);
    best.recipeCount = recipes.length;
    return best;
  }

  const api = { EFFECTS, INGREDIENTS, BY_NAME, DEFAULT_SETTINGS, brew, plan, parseLine, parseOcr, matchName, basePower };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Alchemy = api;
})(typeof window !== "undefined" ? window : globalThis);
