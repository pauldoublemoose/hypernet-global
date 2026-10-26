/* Preview review markers. Inert unless the URL has ?check=.
   Loaded last from index.html. Not part of the product: leave this file and its
   script tag out of any upstream package. No network. */
(function () {
  'use strict';
  try {
    if (!window.URLSearchParams) return;
    var params = new URLSearchParams(location.search);
    if (!params.has('check')) return;
    start(params.get('check') || '');
  } catch (e) {
    if (window.__RVM_DEBUG) throw e;
  }

  function start(check) {
    var RED = '#e53935';
    var items = parse(check);
    items.forEach(function (it) { it.done = lsGet(doneKey(it)) === '1'; });

    var css = document.createElement('style');
    css.setAttribute('data-rvm', '');
    css.textContent = [
      '.rvm-root{display:contents}',
      '.rvm-box{position:fixed;z-index:2147483000;box-sizing:border-box;border:3px solid ' + RED + ';border-radius:2px;background:transparent;pointer-events:auto;user-select:none;touch-action:manipulation}',
      '.rvm-box.rvm-out{opacity:0;transition:opacity .18s ease;pointer-events:none}',
      '.rvm-cap{position:absolute;left:-3px;bottom:100%;display:flex;align-items:center;gap:4px;margin-bottom:2px;max-width:calc(100vw - 16px)}',
      '.rvm-flip .rvm-cap{bottom:auto;top:100%;margin:2px 0 0}',
      '.rvm-badge{flex:0 0 auto;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:' + RED + ';color:#fff;font:700 11px/18px system-ui,sans-serif;text-align:center}',
      '.rvm-tag{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:' + RED + ';color:#fff;font:600 12px/1.3 system-ui,sans-serif;padding:2px 6px;border-radius:2px}',
      '.rvm-panel{position:fixed;z-index:2147483002;right:12px;bottom:12px;width:280px;height:320px;min-width:220px;min-height:140px;max-height:min(70vh,440px);box-sizing:border-box;display:flex;flex-direction:column;background:#fff;color:#1a1a1a;border:2px solid ' + RED + ';border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.18);font:13px/1.35 system-ui,sans-serif;overflow:hidden}',
      '.rvm-panel.rvm-sized{max-height:none}',
      '.rvm-panel[hidden],.rvm-pill[hidden]{display:none !important}',
      '.rvm-head{flex:0 0 auto;display:flex;align-items:center;gap:6px;background:' + RED + ';color:#fff;padding:6px 8px;cursor:grab;user-select:none;touch-action:none}',
      '.rvm-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}',
      '.rvm-head button{margin:0;min-height:0;height:auto;padding:2px 4px;border:0;background:transparent;box-shadow:none;color:#fff;font:600 12px/1.2 system-ui,sans-serif;cursor:pointer}',
      '.rvm-list,.rvm-notes{display:block;width:100%;min-height:0;height:auto;box-sizing:border-box;margin:0;border:0;border-top:1px solid #f3c1bf;border-radius:0;box-shadow:none;background:#fff;color:#1a1a1a;resize:none;overflow:auto;font:13px/1.4 ui-monospace,ui-monospace,monospace;padding:8px}',
      '.rvm-list{flex:2 1 auto}',
      '.rvm-notes{flex:1 1 auto}',
      '.rvm-foot{flex:0 0 auto;padding:4px 8px 6px}',
      '.rvm-clear{margin:0;min-height:0;height:auto;padding:0;border:0;background:none;box-shadow:none;color:' + RED + ';font:12px/1.2 system-ui,sans-serif;text-decoration:underline;cursor:pointer}',
      '.rvm-edge{position:absolute;z-index:3;touch-action:none;user-select:none}',
      '.rvm-edge-w{left:0;top:0;bottom:0;width:8px;cursor:ew-resize}',
      '.rvm-edge-n{left:0;right:0;top:0;height:8px;cursor:ns-resize}',
      '.rvm-grip{position:absolute;z-index:4;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;touch-action:none;user-select:none}',
      '.rvm-grip:before{content:"";position:absolute;right:4px;bottom:4px;width:8px;height:8px;border-right:2px solid ' + RED + ';border-bottom:2px solid ' + RED + '}',
      '.rvm-pill{position:fixed;z-index:2147483002;right:12px;bottom:12px;border:0;border-radius:999px;background:' + RED + ';color:#fff;padding:8px 12px;font:700 12px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2)}',
      '@media (max-width:760px){',
      '.rvm-panel{left:0 !important;right:0 !important;top:auto !important;bottom:0 !important;width:auto !important;height:auto;min-width:0;max-height:46vh;border-radius:12px 12px 0 0;border-width:2px 0 0}',
      '.rvm-panel.rvm-sized{max-height:100vh}',
      '.rvm-list,.rvm-notes{font-size:16px}',
      '.rvm-grip,.rvm-edge-w{display:none}',
      '.rvm-edge-n{height:12px}',
      '.rvm-pill{right:10px;bottom:calc(10px + env(safe-area-inset-bottom))}',
      '.rvm-head{cursor:default}',
      '}'
    ].join('');
    document.head.appendChild(css);

    var root = el('div', 'rvm-root');
    var panel = el('div', 'rvm-panel');
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Review notes');
    var head = el('div', 'rvm-head');
    var title = el('span', 'rvm-title');
    title.appendChild(document.createTextNode('Review '));
    var countEl = el('span', 'rvm-count');
    title.appendChild(countEl);
    var copyBtn = button('rvm-copy', 'Copy');
    var minBtn = button('rvm-min', '\u2013');
    minBtn.setAttribute('aria-label', 'Minimize');
    head.appendChild(title); head.appendChild(copyBtn); head.appendChild(minBtn);
    var listEl = document.createElement('textarea');
    listEl.className = 'rvm-list';
    listEl.setAttribute('aria-label', 'Checklist');
    listEl.setAttribute('spellcheck', 'false');
    var notesEl = document.createElement('textarea');
    notesEl.className = 'rvm-notes';
    notesEl.setAttribute('aria-label', 'Feedback');
    notesEl.setAttribute('placeholder', 'Feedback');
    var foot = el('div', 'rvm-foot');
    var clearBtn = button('rvm-clear', 'clear all');
    foot.appendChild(clearBtn);
    var edgeN = el('div', 'rvm-edge rvm-edge-n');
    edgeN.setAttribute('role', 'separator');
    edgeN.setAttribute('aria-orientation', 'horizontal');
    edgeN.setAttribute('aria-label', 'Resize height');
    var edgeW = el('div', 'rvm-edge rvm-edge-w');
    edgeW.setAttribute('role', 'separator');
    edgeW.setAttribute('aria-orientation', 'vertical');
    edgeW.setAttribute('aria-label', 'Resize width');
    var grip = el('div', 'rvm-grip');
    grip.setAttribute('role', 'separator');
    grip.setAttribute('aria-label', 'Resize');
    panel.appendChild(head); panel.appendChild(listEl); panel.appendChild(notesEl); panel.appendChild(foot);
    panel.appendChild(edgeN); panel.appendChild(edgeW); panel.appendChild(grip);
    var pill = button('rvm-pill', 'Review 0/0');
    pill.hidden = true;
    root.appendChild(panel); root.appendChild(pill);
    document.body.appendChild(root);

    var saved = readSaved();
    listEl.value = saved ? saved.list : defaultList();
    notesEl.value = saved ? saved.notes : '';
    applyUi();
    scan();
    if (saved) syncList(); else listEl.value = defaultList();
    updateCount();

    listEl.addEventListener('input', saveText);
    notesEl.addEventListener('input', saveText);
    copyBtn.addEventListener('click', onCopy);
    minBtn.addEventListener('click', function () { minimize(true); });
    pill.addEventListener('click', function () { minimize(false); });
    clearBtn.addEventListener('click', function (ev) {
      if (ev.preventDefault) ev.preventDefault();
      items.forEach(dismiss);
    });
    drag(head);
    resize(grip, 'se');
    resize(edgeW, 'w');
    resize(edgeN, 'n');

    var frame = 0;
    window.addEventListener('scroll', function () {
      if (frame) return;
      var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
      frame = raf(function () { frame = 0; placeAll(); });
    }, true);
    window.addEventListener('resize', function () { placeAll(); scan(); });

    var timer = setInterval(function () {
      try {
        if (allDone()) { clearInterval(timer); timer = null; return; }
        scan();
      } catch (err) { if (window.__RVM_DEBUG) throw err; }
    }, 1000);
    setTimeout(function () { try { scan(); } catch (err) { if (window.__RVM_DEBUG) throw err; } }, 50);
    setTimeout(function () { try { scan(); } catch (err) { if (window.__RVM_DEBUG) throw err; } }, 400);

    function parse(s) {
      var out = [];
      String(s).split('|').forEach(function (raw) {
        raw = raw.trim();
        if (!raw) return;
        var i = raw.indexOf('~');
        var target = (i >= 0 ? raw.slice(0, i) : raw).trim();
        var label = (i >= 0 ? raw.slice(i + 1) : '').trim();
        if (!target) return;
        var text = target.slice(0, 2) === 't:' ? target.slice(2).trim() : target;
        if (!label) label = text;
        out.push({ n: out.length + 1, raw: raw, target: target, label: label, done: false, found: false, el: null, box: null });
      });
      return out;
    }

    function defaultList() {
      return items.map(function (it) {
        return it.n + '. [' + (it.done ? 'x' : ' ') + '] ' + it.label + (!it.done && !it.found ? ' (not on this screen)' : '');
      }).join('\n');
    }

    function syncList() {
      var lines = listEl.value.split('\n');
      var changed = false;
      items.forEach(function (it) {
        var re = new RegExp('^(\\s*' + it.n + '\\.\\s*)\\[([ xX])\\](.*)$');
        for (var i = 0; i < lines.length; i++) {
          var m = lines[i].match(re);
          if (!m) continue;
          var body = m[3].replace(/(?:\s*\(not on this screen\))+\s*$/, '');
          var suffix = (!it.done && !it.found) ? ' (not on this screen)' : '';
          var mark = it.done ? 'x' : m[2];
          var next = m[1] + '[' + mark + ']' + body + suffix;
          if (next !== lines[i]) { lines[i] = next; changed = true; }
          break;
        }
      });
      if (!changed) return;
      var a = listEl.selectionStart, b = listEl.selectionEnd, focused = document.activeElement === listEl;
      listEl.value = lines.join('\n');
      if (focused) { try { listEl.selectionStart = a; listEl.selectionEnd = b; } catch (err) {} }
      saveText();
    }

    function scan() {
      if (allDone()) { if (timer) { clearInterval(timer); timer = null; } return; }
      var changed = false;
      items.forEach(function (it) {
        if (it.done) return;
        var el = locate(it);
        var found = !!el;
        if (el) {
          it.el = el;
          if (!it.box) it.box = makeBox(it);
          it.box.style.display = '';
          place(it);
        } else if (it.box) {
          it.box.remove();
          it.box = null;
          it.el = null;
        }
        if (found !== it.found) { it.found = found; changed = true; }
      });
      if (changed) syncList();
      updateCount();
    }

    function locate(it) {
      var t = it.target;
      var el = t.slice(0, 2) === 't:' ? findText(t.slice(2).trim()) : findSel(t);
      return el && visible(el) ? el : null;
    }

    function findSel(sel) {
      var list;
      try { list = document.querySelectorAll(sel); } catch (err) { return null; }
      for (var i = 0; i < list.length; i++) if (!inOverlay(list[i]) && visible(list[i])) return list[i];
      return null;
    }

    var textCache = null;
    function findText(q) {
      q = String(q || '').toLowerCase();
      if (!q) return null;
      textCache = new Map();
      var all = document.querySelectorAll('*');
      var bestC = null, bestA = null, areaC = Infinity, areaA = Infinity;
      for (var i = 0; i < all.length; i++) {
        var node = all[i];
        if (inOverlay(node) || !visible(node)) continue;
        var text = shownText(node);
        if (!text || text.toLowerCase().indexOf(q) < 0) continue;
        var r = node.getBoundingClientRect();
        var area = r.width * r.height;
        if (clickable(node) && area <= areaC) { bestC = node; areaC = area; }
        if (area <= areaA) { bestA = node; areaA = area; }
      }
      textCache = null;
      return bestC || bestA;
    }
    /* Visible text only. The notes panel, the boxes and hidden subtrees are left out,
       so a label in the panel is not a match and a hidden node does not light up its parent. */
    function shownText(node) {
      if (textCache && textCache.has(node)) return textCache.get(node);
      var result = '';
      if (!inOverlay(node) && visible(node)) {
        if (node.tagName === 'TEXTAREA' || node.tagName === 'INPUT') result = String(node.value || '').trim();
        else {
          var parts = [], kids = node.childNodes || [];
          for (var i = 0; i < kids.length; i++) {
            var c = kids[i];
            if (c.nodeType === 3) parts.push(c.data != null ? c.data : (c.textContent || ''));
            else if (c.nodeType === 1) parts.push(shownText(c));
          }
          result = parts.join('').trim();
        }
      }
      if (textCache) textCache.set(node, result);
      return result;
    }

    function clickable(node) {
      var tag = node.tagName;
      if (/^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY|LABEL)$/.test(tag)) return true;
      var role = (node.getAttribute('role') || '').toLowerCase();
      if (role === 'button' || role === 'link' || role === 'tab' || role === 'menuitem') return true;
      if (node.hasAttribute('data-act') || node.hasAttribute('onclick')) return true;
      try { return getComputedStyle(node).cursor === 'pointer'; } catch (err) { return false; }
    }

    function visible(node) {
      if (!node || node.nodeType !== 1 || inOverlay(node)) return false;
      if (node.closest && node.closest('[hidden]')) return false;
      if (node.isConnected === false) return false;
      var cs;
      try { cs = getComputedStyle(node); } catch (err) { return false; }
      if (!cs || cs.display === 'none' || cs.visibility === 'hidden' || (cs.opacity !== '' && Number(cs.opacity) === 0)) return false;
      var r = node.getBoundingClientRect();
      return r.width >= 1 && r.height >= 1;
    }

    function inOverlay(node) {
      if (!node || !node.closest) return false;
      return !!node.closest('.rvm-root, .rvm-box');
    }

    function makeBox(it) {
      var box = el('div', 'rvm-box');
      box.setAttribute('data-rvm', String(it.n));
      box.setAttribute('role', 'button');
      box.setAttribute('aria-label', 'Dismiss ' + it.n + '. ' + it.label);
      var cap = el('div', 'rvm-cap');
      var badge = el('span', 'rvm-badge');
      badge.textContent = String(it.n);
      var tag = el('span', 'rvm-tag');
      tag.textContent = it.label;
      cap.appendChild(badge); cap.appendChild(tag);
      box.appendChild(cap);
      box.addEventListener('click', function (ev) {
        if (ev.preventDefault) ev.preventDefault();
        if (ev.stopPropagation) ev.stopPropagation();
        dismiss(it);
      });
      document.body.appendChild(box);
      return box;
    }

    function place(it) {
      var r = it.el.getBoundingClientRect();
      var pad = 4;
      var box = it.box;
      box.style.left = (r.left - pad) + 'px';
      box.style.top = (r.top - pad) + 'px';
      box.style.width = (r.width + pad * 2) + 'px';
      box.style.height = (r.height + pad * 2) + 'px';
      box.classList.toggle('rvm-flip', r.top < 28);
    }

    function placeAll() {
      items.forEach(function (it) {
        if (!it.box || it.done) return;
        if (!it.el || it.el.isConnected === false || !visible(it.el)) { it.box.style.display = 'none'; return; }
        it.box.style.display = '';
        place(it);
      });
    }

    function dismiss(it) {
      if (!it || it.done) return;
      it.done = true;
      lsSet(doneKey(it), '1');
      var box = it.box;
      if (box) {
        box.classList.add('rvm-out');
        box.style.pointerEvents = 'none';
        it.box = null;
        setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 180);
      }
      syncList();
      updateCount();
      if (allDone() && timer) { clearInterval(timer); timer = null; }
    }

    function allDone() { return items.every(function (it) { return it.done; }); }

    function updateCount() {
      var d = items.filter(function (it) { return it.done; }).length;
      var t = d + '/' + items.length;
      countEl.textContent = t;
      pill.textContent = 'Review ' + t;
    }

    function onCopy() {
      var list = listEl.value.replace(/\s+$/, '');
      var extra = notesEl.value.replace(/\s+$/, '');
      var text = headerLine() + '\n\n' + list + (extra ? '\n\n' + extra : '') + '\n';
      var show = function () {
        copyBtn.textContent = 'Copied';
        setTimeout(function () { if (copyBtn.textContent === 'Copied') copyBtn.textContent = 'Copy'; }, 1200);
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          Promise.resolve(navigator.clipboard.writeText(text)).then(show, function () { if (fallbackCopy(text)) show(); });
          return;
        }
      } catch (err) {}
      if (fallbackCopy(text)) show();
    }

    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      var ok = false;
      try { ta.select(); ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }

    function headerLine() {
      var rev = revision();
      var url = pageUrl();
      return rev ? rev + ' ' + url : url;
    }

    function pageUrl() {
      var u = new URL(location.href);
      u.searchParams.delete('_vercel_share');
      return u.toString();
    }

    function revision() {
      var nodes = document.querySelectorAll('meta[name],meta[property]');
      for (var i = 0; i < nodes.length; i++) {
        var name = (nodes[i].getAttribute('name') || nodes[i].getAttribute('property') || '').toLowerCase();
        if (!/(branch|commit|revision|git-commit|\bsha\b)/.test(name)) continue;
        var content = (nodes[i].getAttribute('content') || '').trim();
        if (content) return content;
      }
      var host = location.hostname || '';
      var m = /-git-(.+)\.vercel\.app$/i.exec(host);
      if (!m) return '';
      var parts = m[1].split('-');
      if (parts.length > 1) parts.pop();
      return parts.join('-');
    }

    function minimize(on) {
      panel.hidden = !!on;
      pill.hidden = !on;
      updateCount();
      saveUi();
    }

    var MIN_W = 220, MIN_H = 140;

    function trackPointer(handle, begin) {
      var pointer = typeof PointerEvent === 'function';
      handle.addEventListener(pointer ? 'pointerdown' : 'mousedown', function (e) {
        if (e.button && e.button !== 0) return;
        var session = begin(e);
        if (!session) return;
        if (e.preventDefault) e.preventDefault();
        if (pointer && e.pointerId != null && handle.setPointerCapture) {
          try { handle.setPointerCapture(e.pointerId); } catch (err) {}
        }
        var moveName = pointer ? 'pointermove' : 'mousemove';
        var upName = pointer ? 'pointerup' : 'mouseup';
        function mv(ev) { session.move(ev); }
        function up() {
          window.removeEventListener(moveName, mv);
          window.removeEventListener(upName, up);
          if (pointer) window.removeEventListener('pointercancel', up);
          session.end();
        }
        window.addEventListener(moveName, mv);
        window.addEventListener(upName, up);
        if (pointer) window.addEventListener('pointercancel', up);
      });
    }

    function drag(handle) {
      trackPointer(handle, function (e) {
        if (e.target && e.target.closest && e.target.closest('button')) return null;
        if (narrow()) return null;
        var r = panel.getBoundingClientRect();
        var dx = e.clientX - r.left, dy = e.clientY - r.top;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        return {
          move: function (ev) {
            var x = ev.clientX - dx, y = ev.clientY - dy;
            var maxX = Math.max(0, (window.innerWidth || 0) - 80);
            var maxY = Math.max(0, (window.innerHeight || 0) - 40);
            if (x < 0) x = 0;
            if (y < 0) y = 0;
            if (x > maxX) x = maxX;
            if (y > maxY) y = maxY;
            panel.style.left = x + 'px';
            panel.style.top = y + 'px';
          },
          end: saveUi
        };
      });
    }

    /* se follows the bottom-right corner. w and n move the left and top edges,
       which is how a bottom-right panel grows into the page. A phone dock only
       changes height from the top edge. */
    function resize(handle, mode) {
      trackPointer(handle, function (e) {
        if (narrow() && mode !== 'n') return null;
        var r = panel.getBoundingClientRect();
        var start = { x: e.clientX, y: e.clientY, left: r.left, top: r.top, width: r.width, height: r.height };
        var phone = narrow();
        return {
          move: function (ev) { resizeMove(mode, start, ev, phone); },
          end: saveUi
        };
      });
    }

    function resizeMove(mode, start, ev, phone) {
      var dx = ev.clientX - start.x, dy = ev.clientY - start.y;
      if (phone) {
        panel.style.height = clamp(start.height - dy, MIN_H, window.innerHeight || 0) + 'px';
        panel.classList.add('rvm-sized');
        return;
      }
      var left = start.left, top = start.top, right = start.left + start.width, bottom = start.top + start.height;
      if (mode === 'se' || mode === 'w') {
        if (mode === 'w') left = start.left + dx;
        else right = start.left + start.width + dx;
      }
      if (mode === 'se' || mode === 'n') {
        if (mode === 'n') top = start.top + dy;
        else bottom = start.top + start.height + dy;
      }
      var box = fitBox(left, top, right, bottom, mode);
      panel.style.left = box.left + 'px';
      panel.style.top = box.top + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.width = box.width + 'px';
      panel.style.height = box.height + 'px';
      panel.classList.add('rvm-sized');
    }

    function fitBox(left, top, right, bottom, mode) {
      var vw = window.innerWidth || 0, vh = window.innerHeight || 0;
      var minW = vw > 0 ? Math.min(MIN_W, vw) : MIN_W;
      var minH = vh > 0 ? Math.min(MIN_H, vh) : MIN_H;
      if (vw > 0) {
        if (left < 0) left = 0;
        if (right > vw) right = vw;
        if (right < left) right = left;
      }
      if (vh > 0) {
        if (top < 0) top = 0;
        if (bottom > vh) bottom = vh;
        if (bottom < top) bottom = top;
      }
      if (right - left < minW) {
        if (mode === 'w') left = right - minW;
        else right = left + minW;
        if (vw > 0 && left < 0) { left = 0; right = Math.min(vw, minW); }
        if (vw > 0 && right > vw) { right = vw; left = Math.max(0, right - minW); }
      }
      if (bottom - top < minH) {
        if (mode === 'n') top = bottom - minH;
        else bottom = top + minH;
        if (vh > 0 && top < 0) { top = 0; bottom = Math.min(vh, minH); }
        if (vh > 0 && bottom > vh) { bottom = vh; top = Math.max(0, bottom - minH); }
      }
      return { left: left, top: top, width: right - left, height: bottom - top };
    }

    function clamp(n, min, max) {
      var lo = max > 0 ? Math.min(min, max) : min;
      if (n < lo) n = lo;
      if (max > 0 && n > max) n = max;
      return n;
    }

    function narrow() {
      if (window.matchMedia) return window.matchMedia('(max-width: 760px)').matches;
      return (window.innerWidth || 0) <= 760;
    }

    function applyUi() {
      var ui = null;
      try { ui = JSON.parse(lsGet(uiKey()) || 'null'); } catch (err) { ui = null; }
      if (!ui) return;
      if (typeof ui.x === 'number' && typeof ui.y === 'number') {
        panel.style.left = Math.max(0, ui.x) + 'px';
        panel.style.top = Math.max(0, ui.y) + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
      }
      if (typeof ui.w === 'number') panel.style.width = ui.w + 'px';
      if (typeof ui.h === 'number') panel.style.height = ui.h + 'px';
      if (typeof ui.w === 'number' || typeof ui.h === 'number') panel.classList.add('rvm-sized');
      if (ui.min) { panel.hidden = true; pill.hidden = false; }
    }

    function saveUi() {
      var ui = { min: !!panel.hidden };
      if (panel.style.left) {
        ui.x = parseFloat(panel.style.left);
        ui.y = parseFloat(panel.style.top);
      }
      if (panel.style.width) ui.w = parseFloat(panel.style.width);
      if (panel.style.height) ui.h = parseFloat(panel.style.height);
      lsSet(uiKey(), JSON.stringify(ui));
    }

    function saveText() {
      lsSet(textKey(), JSON.stringify({ list: listEl.value, notes: notesEl.value }));
    }

    function readSaved() {
      var raw = lsGet(textKey());
      if (raw == null) return null;
      try {
        var j = JSON.parse(raw);
        if (j && typeof j.list === 'string') return { list: j.list, notes: typeof j.notes === 'string' ? j.notes : '' };
      } catch (err) {}
      return { list: String(raw), notes: '' };
    }

    function doneKey(it) { return 'rvm:v1:done:' + check + '\n' + it.n + '\n' + it.raw; }
    function textKey() { return 'rvm:v1:text:' + check; }
    function uiKey() { return 'rvm:v1:ui:' + check; }
  }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (err) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (err) {} }
  function el(tag, cls) {
    var node = document.createElement(tag);
    node.className = cls;
    return node;
  }
  function button(cls, text) {
    var node = document.createElement('button');
    node.type = 'button';
    node.className = cls;
    node.textContent = text;
    return node;
  }
})();
