// node --test scripts/review-markers.test.mjs
// The overlay is a browser script. These checks run it against a small DOM (no extra deps)
// and cover the two cases the preview needs: inert without ?check=, and boxes / panel /
// dismiss / notes when ?check= is present.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { setTimeout as wait } from "node:timers/promises";
import { setTimeout as nodeSetTimeout, clearTimeout, setInterval as nodeSetInterval, clearInterval } from "node:timers";

const SRC = readFileSync(new URL("../review-markers.js", import.meta.url), "utf8");

test("source makes no network calls", () => {
  assert.doesNotMatch(SRC, /\bfetch\s*\(|XMLHttpRequest|\bWebSocket\b/);
});

test("without check it injects no DOM", () => {
  const { document } = boot("?offline=1", (doc) => {
    const b = doc.createElement("button");
    b.id = "newbtn";
    b.textContent = "New";
    doc.body.appendChild(b);
  });
  assert.equal(document.querySelector("[data-rvm]"), null);
  assert.equal(document.querySelector(".rvm-root"), null);
  assert.equal(document.querySelector(".rvm-box"), null);
  assert.equal(document.querySelector(".rvm-panel"), null);
  assert.equal(document.body.childNodes.filter((n) => n.nodeType === 1).length, 1);
});

test("check draws numbered boxes and a panel, and a click dismisses that item", async () => {
  const check = "#newbtn~Open New|t:Join or log in~The way in|t:Show all~Show all|t:Missing~Missing";
  const search = "?offline=1&_vercel_share=sekret&check=" + encodeURIComponent(check);
  const store = new Map();
  const page = boot(search, (doc) => {
    const meta = doc.createElement("meta");
    meta.setAttribute("name", "revision");
    meta.setAttribute("content", "abc123");
    doc.head.appendChild(meta);
    doc.body.appendChild(box(doc, "button", { id: "newbtn", x: 20, y: 10, w: 72, h: 32, text: "New" }));
    const wrap = box(doc, "div", { id: "wrap", x: 0, y: 60, w: 400, h: 120, text: "" });
    wrap.appendChild(box(doc, "button", { id: "join", x: 20, y: 70, w: 160, h: 36, text: "Join or log in" }));
    doc.body.appendChild(wrap);
    const later = box(doc, "p", { id: "show", x: 20, y: 200, w: 80, h: 24, text: "Show all" });
    later.hidden = true;
    doc.body.appendChild(later);
  }, { store, hrefHost: "preview.example.com" });

  const { document, window } = page;
  const css = document.querySelector("style").textContent;
  assert.match(css, /#e53935/);
  assert.match(css, /max-width:\s*760px/);
  assert.match(css, /bottom:\s*0/);

  const boxes = document.querySelectorAll(".rvm-box");
  assert.equal(boxes.length, 2);
  assert.deepEqual([...document.querySelectorAll(".rvm-badge")].map((n) => n.textContent), ["1", "2"]);
  assert.equal(boxes[0].style.left, "16px");
  assert.equal(boxes[1].style.left, "16px");
  assert.equal(boxes[1].style.top, "66px");

  const list = document.querySelector(".rvm-list");
  const notes = document.querySelector(".rvm-notes");
  assert.match(list.value, /^1\. \[ \] Open New$/m);
  assert.match(list.value, /^2\. \[ \] The way in$/m);
  assert.match(list.value, /^3\. \[ \] Show all \(not on this screen\)$/m);
  assert.match(list.value, /^4\. \[ \] Missing \(not on this screen\)$/m);
  assert.equal(document.querySelector(".rvm-count").textContent, "0/4");
  assert.equal(document.querySelector(".rvm-pill").hidden, true);

  boxes[0].click();
  assert.match(list.value, /^1\. \[x\] Open New$/m);
  assert.match(list.value, /^2\. \[ \] The way in$/m);
  assert.equal(document.querySelector('[data-rvm="1"]').classList.contains("rvm-out"), true);
  assert.equal(document.querySelector('[data-rvm="1"]').style.pointerEvents, "none");
  assert.equal(document.querySelector(".rvm-count").textContent, "1/4");

  await wait(220);
  assert.equal(document.querySelector('[data-rvm="1"]'), null);
  assert.deepEqual([...document.querySelectorAll(".rvm-badge")].map((n) => n.textContent), ["2"]);

  document.getElementById("show").hidden = false;
  window.dispatchEvent({ type: "resize" });
  assert.match(list.value, /^3\. \[ \] Show all$/m);
  assert.equal(document.querySelector('[data-rvm="3"]').querySelector(".rvm-badge").textContent, "3");
  assert.equal(document.querySelector('[data-rvm="2"]').querySelector(".rvm-badge").textContent, "2");

  notes.value = "The join button is easy to miss.";
  notes.dispatchEvent({ type: "input" });
  list.value = list.value.replace("Open New", "Open New — good");
  list.dispatchEvent({ type: "input" });

  let copied = "";
  window.navigator.clipboard.writeText = (text) => { copied = text; return Promise.resolve(); };
  document.querySelector(".rvm-copy").click();
  await wait(0);
  assert.equal(document.querySelector(".rvm-copy").textContent, "Copied");
  assert.match(copied, /^abc123 https:\/\/preview\.example\.com\/index\.html\?offline=1&check=/);
  assert.doesNotMatch(copied, /_vercel_share|sekret/);
  assert.match(copied, /1\. \[x\] Open New — good/);
  assert.match(copied, /2\. \[ \] The way in/);
  assert.match(copied, /3\. \[ \] Show all/);
  assert.match(copied, /4\. \[ \] Missing \(not on this screen\)/);
  assert.match(copied, /The join button is easy to miss\./);

  const head = document.querySelector(".rvm-head");
  head.dispatchEvent({ type: "mousedown", button: 0, clientX: 30, clientY: 50, target: head });
  window.dispatchEvent({ type: "mousemove", clientX: 120, clientY: 90 });
  window.dispatchEvent({ type: "mouseup" });
  assert.equal(document.querySelector(".rvm-panel").style.left, "106px");
  assert.equal(document.querySelector(".rvm-panel").style.top, "80px");

  window.innerWidth = 375;
  const before = document.querySelector(".rvm-panel").style.left;
  head.dispatchEvent({ type: "mousedown", button: 0, clientX: 10, clientY: 10, target: head });
  window.dispatchEvent({ type: "mousemove", clientX: 200, clientY: 200 });
  window.dispatchEvent({ type: "mouseup" });
  assert.equal(document.querySelector(".rvm-panel").style.left, before);

  document.querySelector(".rvm-min").click();
  const pill = document.querySelector(".rvm-pill");
  assert.equal(document.querySelector(".rvm-panel").hidden, true);
  assert.equal(pill.hidden, false);
  assert.equal(pill.textContent, "Review 1/4");
  pill.click();
  assert.equal(document.querySelector(".rvm-panel").hidden, false);
  document.querySelector(".rvm-min").click();

  const again = boot(search, (doc) => {
    doc.body.appendChild(box(doc, "button", { id: "newbtn", x: 20, y: 10, w: 72, h: 32, text: "New" }));
    doc.body.appendChild(box(doc, "button", { id: "join", x: 20, y: 70, w: 160, h: 36, text: "Join or log in" }));
  }, { store, hrefHost: "preview.example.com" });
  const list2 = again.document.querySelector(".rvm-list");
  assert.match(list2.value, /1\. \[x\] Open New — good/);
  assert.match(list2.value, /2\. \[ \] The way in/);
  assert.equal(again.document.querySelector(".rvm-notes").value, "The join button is easy to miss.");
  assert.equal(again.document.querySelector(".rvm-panel").hidden, true);
  assert.equal(again.document.querySelector(".rvm-panel").style.left, "106px");
  assert.equal(again.document.querySelector('[data-rvm="1"]'), null);
  assert.equal(again.document.querySelector('[data-rvm="2"]').querySelector(".rvm-badge").textContent, "2");

  again.document.querySelector(".rvm-pill").click();
  again.document.querySelector(".rvm-clear").click();
  assert.match(again.document.querySelector(".rvm-list").value, /1\. \[x\]/);
  assert.match(again.document.querySelector(".rvm-list").value, /2\. \[x\] The way in/);
  assert.match(again.document.querySelector(".rvm-list").value, /3\. \[x\]/);
  assert.match(again.document.querySelector(".rvm-list").value, /4\. \[x\] Missing/);
  assert.equal(again.document.querySelector(".rvm-count").textContent, "4/4");
  assert.equal(again.document.querySelector(".rvm-panel").hidden, false);
  await wait(220);
  assert.equal(again.document.querySelectorAll(".rvm-box").length, 0);
});

test("a missing label uses the target text, and a Vercel host supplies the revision", async () => {
  const search = "?check=" + encodeURIComponent("t:New");
  const { document } = boot(search, (doc) => {
    doc.body.appendChild(box(doc, "button", { id: "newbtn", x: 8, y: 8, w: 60, h: 28, text: "New" }));
  }, { hrefHost: "hypernet-git-fix-preview-markers-sandbox.vercel.app" });
  assert.match(document.querySelector(".rvm-list").value, /^1\. \[ \] New$/m);
  assert.equal(document.querySelector(".rvm-badge").textContent, "1");
  let copied = "";
  document.defaultView.navigator.clipboard.writeText = (text) => { copied = text; return Promise.resolve(); };
  document.querySelector(".rvm-copy").click();
  await wait(0);
  assert.match(copied, /^fix-preview-markers https:\/\/hypernet-git-fix-preview-markers-sandbox\.vercel\.app\/index\.html\?check=/);
  assert.match(copied, /1\. \[ \] New/);
});

function box(doc, tag, o) {
  const el = doc.createElement(tag);
  if (o.id) el.id = o.id;
  el.setAttribute("data-x", String(o.x));
  el.setAttribute("data-y", String(o.y));
  el.setAttribute("data-w", String(o.w));
  el.setAttribute("data-h", String(o.h));
  if (o.text) el.textContent = o.text;
  return el;
}

function boot(search, build, opts = {}) {
  const store = opts.store || new Map();
  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
  };
  const document = createDocument();
  build(document);
  const hostname = opts.hrefHost || "preview.example.com";
  const href = "https://" + hostname + "/index.html" + search;
  const location = { search, href, hostname, pathname: "/index.html" };
  const sandbox = {
    URL, URLSearchParams, Promise, JSON, Math, Map, RegExp, Number, String, Infinity, parseFloat, parseInt,
    setTimeout(fn, ms, ...a) { const t = nodeSetTimeout(fn, ms, ...a); t.unref?.(); return t; },
    clearTimeout, setInterval(fn, ms, ...a) { const t = nodeSetInterval(fn, ms, ...a); t.unref?.(); return t; },
    clearInterval,
    document, location, localStorage,
    navigator: { clipboard: { writeText: () => Promise.resolve() } },
    innerWidth: 1024, innerHeight: 800,
    __RVM_DEBUG: true,
    _ev: {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.getComputedStyle = (el) => computed(el);
  sandbox.matchMedia = (q) => {
    const m = /max-width:\s*(\d+)px/.exec(q);
    return { matches: m ? sandbox.innerWidth <= Number(m[1]) : false, media: q };
  };
  sandbox.addEventListener = (type, fn) => on(sandbox, type, fn);
  sandbox.removeEventListener = (type, fn) => { sandbox._ev[type] = (sandbox._ev[type] || []).filter((f) => f !== fn); };
  sandbox.dispatchEvent = (ev) => emit(sandbox, ev.type || "event", ev);
  document.defaultView = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "review-markers.js" });
  return { document, window: sandbox, localStorage };
}

function computed(el) {
  const st = el.style || {};
  let display = st.display || "";
  const tag = el.tagName;
  if (el.hasAttribute?.("hidden")) display = "none";
  if (tag === "STYLE" || tag === "SCRIPT" || tag === "HEAD" || tag === "META" || tag === "TITLE") display = "none";
  if (!display) display = "block";
  return {
    display,
    visibility: st.visibility || "visible",
    opacity: st.opacity === "" || st.opacity == null ? "1" : String(st.opacity),
    cursor: st.cursor || "auto",
  };
}

function createDocument() {
  const doc = {
    nodeType: 9,
    _ev: {},
    childNodes: [],
    activeElement: null,
    defaultView: null,
    createElement: (tag) => new El(tag, doc),
    createTextNode: (text) => ({ nodeType: 3, data: String(text), parentNode: null, parentElement: null }),
    execCommand: () => false,
  };
  const html = new El("html", doc);
  const head = new El("head", doc);
  const body = new El("body", doc);
  doc.appendChild = (n) => { doc.childNodes.push(n); n.parentNode = doc; return n; };
  doc.appendChild(html);
  html.appendChild(head);
  html.appendChild(body);
  doc.head = head;
  doc.body = body;
  doc.documentElement = html;
  doc.querySelectorAll = (sel) => queryAll(doc, sel);
  doc.querySelector = (sel) => queryAll(doc, sel)[0] || null;
  doc.getElementById = (id) => queryAll(doc, "#" + id)[0] || null;
  return doc;
}

class El {
  constructor(tag, doc) {
    this.nodeType = 1;
    this.tagName = String(tag).toUpperCase();
    this.ownerDocument = doc;
    this.parentNode = null;
    this.childNodes = [];
    this._attr = Object.create(null);
    this._class = "";
    this._ev = {};
    this.value = "";
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.style = new Proxy(Object.create(null), {
      get: (t, p) => (typeof p === "symbol" ? t[p] : (t[p] ?? "")),
      set: (t, p, v) => { t[p] = v == null ? "" : String(v); return true; },
    });
  }
  get parentElement() { return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null; }
  get isConnected() {
    let n = this;
    while (n) { if (n.nodeType === 9) return true; n = n.parentNode; }
    return false;
  }
  get id() { return this._attr.id || ""; }
  set id(v) { this.setAttribute("id", v); }
  get className() { return this._class; }
  set className(v) { this._class = String(v); this._attr.class = this._class; }
  get classList() {
    const el = this;
    const set = () => new Set(el._class.split(/\s+/).filter(Boolean));
    const write = (s) => { el.className = [...s].join(" "); };
    return {
      add: (...ns) => { const s = set(); ns.forEach((n) => s.add(n)); write(s); },
      remove: (...ns) => { const s = set(); ns.forEach((n) => s.delete(n)); write(s); },
      contains: (n) => set().has(n),
      toggle: (n, force) => {
        const on = force === undefined ? !set().has(n) : !!force;
        if (on) this.classList.add(n); else this.classList.remove(n);
        return on;
      },
    };
  }
  get textContent() {
    if (this.tagName === "TEXTAREA" || this.tagName === "INPUT") return this.value;
    return this.childNodes.map((c) => (c.nodeType === 3 ? c.data : c.textContent)).join("");
  }
  set textContent(v) {
    if (this.tagName === "TEXTAREA" || this.tagName === "INPUT") { this.value = String(v ?? ""); return; }
    this.childNodes = [];
    if (v != null && v !== "") this.appendChild(this.ownerDocument.createTextNode(v));
  }
  get hidden() { return this.hasAttribute("hidden"); }
  set hidden(v) { if (v) this.setAttribute("hidden", ""); else this.removeAttribute("hidden"); }
  setAttribute(name, value) { this._attr[name] = String(value); if (name === "class") this._class = String(value); }
  getAttribute(name) { return Object.prototype.hasOwnProperty.call(this._attr, name) ? this._attr[name] : null; }
  hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this._attr, name); }
  removeAttribute(name) { delete this._attr[name]; if (name === "class") this._class = ""; }
  appendChild(child) {
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }
  removeChild(child) {
    this.childNodes = this.childNodes.filter((c) => c !== child);
    child.parentNode = null;
    return child;
  }
  remove() { if (this.parentNode && this.parentNode.removeChild) this.parentNode.removeChild(this); }
  closest(sel) {
    let n = this;
    while (n && n.nodeType === 1) { if (matches(n, sel)) return n; n = n.parentElement; }
    return null;
  }
  addEventListener(type, fn) { on(this, type, fn); }
  removeEventListener(type, fn) { this._ev[type] = (this._ev[type] || []).filter((f) => f !== fn); }
  dispatchEvent(ev) { emit(this, ev.type || "event", ev); }
  click() { this.dispatchEvent({ type: "click", button: 0, clientX: 0, clientY: 0, target: this }); }
  select() {}
  focus() { this.ownerDocument.activeElement = this; }
  getBoundingClientRect() {
    const cs = computed(this);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0)
      return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
    const big = this.tagName === "HTML" || this.tagName === "BODY";
    const left = this.style.left !== "" ? parseFloat(this.style.left) : num(this, "data-x", big ? 0 : 16);
    const top = this.style.top !== "" ? parseFloat(this.style.top) : num(this, "data-y", big ? 0 : 40);
    const width = this.style.width !== "" ? parseFloat(this.style.width) : num(this, "data-w", big ? 1200 : 100);
    const height = this.style.height !== "" ? parseFloat(this.style.height) : num(this, "data-h", big ? 800 : 32);
    return { left, top, width, height, right: left + width, bottom: top + height };
  }
  querySelectorAll(sel) { return queryAll(this, sel); }
  querySelector(sel) { return queryAll(this, sel)[0] || null; }
}

function num(el, name, fallback) {
  return el.hasAttribute(name) ? Number(el.getAttribute(name)) : fallback;
}
function on(node, type, fn) { (node._ev[type] || (node._ev[type] = [])).push(fn); }
function emit(node, type, ev) {
  ev.type = type;
  ev.target = ev.target || node;
  ev.preventDefault = ev.preventDefault || (() => {});
  ev.stopPropagation = () => { ev._stop = true; };
  let n = node;
  while (n) {
    ev.currentTarget = n;
    for (const fn of (n._ev && n._ev[type]) || []) { if (ev._stop) return; fn(ev); }
    if (ev._stop) return;
    n = n.parentNode;
  }
}
function queryAll(root, selector) {
  const out = [];
  const start = root.nodeType === 9 ? root.documentElement : root;
  walk(start, (el) => { if (el !== root && matches(el, selector)) out.push(el); });
  return out;
}
function walk(node, fn) {
  for (const child of node.childNodes || []) {
    if (child.nodeType === 1) { fn(child); walk(child, fn); }
  }
}
function matches(el, selector) {
  return String(selector).split(",").some((part) => matchOne(el, part.trim()));
}
function matchOne(el, sel) {
  if (!sel) return false;
  if (sel === "*") return el.nodeType === 1;
  let i = 0;
  let saw = false;
  while (i < sel.length) {
    saw = true;
    const c = sel[i];
    if (c === "#") {
      const m = /^[A-Za-z0-9_-]+/.exec(sel.slice(i + 1));
      if (!m || el.id !== m[0]) return false;
      i += 1 + m[0].length;
    } else if (c === ".") {
      const m = /^[A-Za-z0-9_-]+/.exec(sel.slice(i + 1));
      if (!m || !el.classList.contains(m[0])) return false;
      i += 1 + m[0].length;
    } else if (c === "[") {
      const end = sel.indexOf("]", i);
      if (end < 0) return false;
      const body = sel.slice(i + 1, end);
      const eq = body.indexOf("=");
      if (eq < 0) { if (!el.hasAttribute(body.trim())) return false; }
      else {
        let val = body.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        if (el.getAttribute(body.slice(0, eq).trim()) !== val) return false;
      }
      i = end + 1;
    } else if (c === " " || c === ">") return false;
    else {
      const m = /^[A-Za-z0-9]+/.exec(sel.slice(i));
      if (!m || el.tagName !== m[0].toUpperCase()) return false;
      i += m[0].length;
    }
  }
  return saw;
}
