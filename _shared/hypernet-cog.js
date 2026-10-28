/* One cog for an event or a horizon. Events keep their menu and the Visibility
   and Permissions dialog. A horizon shows Visibility, then the caller's rows,
   and saves only through saveAudience. */
(function (root) {
  "use strict";

  var sessions = typeof WeakMap === "function" ? new WeakMap() : null;
  var list = [];

  function read(el) {
    if (!el) return null;
    if (sessions) return sessions.get(el) || null;
    for (var i = 0; i < list.length; i++) if (list[i].el === el) return list[i].session;
    return null;
  }

  function write(el, session) {
    if (sessions) { sessions.set(el, session); return; }
    for (var i = 0; i < list.length; i++) if (list[i].el === el) { list[i].session = session; return; }
    list.push({ el: el, session: session });
  }

  function drop(el, session) {
    var cur = read(el);
    if (cur !== session) return;
    if (sessions) sessions.delete(el);
    else list = list.filter(function (row) { return row.el !== el; });
  }

  function audienceOf(spec) {
    var raw = spec.audience;
    var Aud = root.HNAudience;
    if (raw && typeof raw === "object") return Aud ? Aud.normalize(raw) : { include: (raw.include || []).slice(), exclude: (raw.exclude || []).slice() };
    if (Aud && Aud.fromPrivacy) return Aud.normalize(Aud.fromPrivacy(raw || "everyone"));
    return { include: ["everyone"], exclude: [] };
  }

  function namedRows() {
    if (typeof root.audienceRows === "function") return root.audienceRows();
    return [
      { token: "everyone", label: "Everyone" },
      { token: "friends", label: "Friends" },
      { token: "fof", label: "Friends of friends" },
      { token: "followers", label: "Followers" }
    ];
  }

  function extraRow(it) {
    return {
      label: it.label,
      icon: it.icon,
      danger: !!it.danger,
      run: function () { if (typeof it.onClick === "function") it.onClick(); }
    };
  }

  function withExtras(base, extras) {
    if (!extras.length) return base;
    var at = -1;
    for (var i = 0; i < base.length; i++) {
      if (base[i] && base[i].label === "Visibility and Permissions") { at = i; break; }
    }
    if (at < 0) return base.concat(extras);
    return base.slice(0, at + 1).concat(extras, base.slice(at + 1));
  }

  function menuFor(session) {
    var spec = session.spec;
    var extras = (spec.items || []).map(extraRow);
    if (spec.kind === "event" && typeof root.eventCogItems === "function") {
      return withExtras(root.eventCogItems(spec.id).slice(), extras);
    }
    return [{ label: "Visibility", icon: "eye", run: function () { openAudience(session); } }].concat(extras);
  }

  function openAudience(session) {
    var aud = audienceOf(session.spec);
    session.aud = aud;
    root.DRAFT = {
      form: "hncog",
      audience: aud,
      privacy: root.HNAudience && root.HNAudience.derivePrivacy ? root.HNAudience.derivePrivacy(aud) : "everyone",
      editing: null
    };
    var picker = root.HNAudience.pickerHTML(aud, namedRows(), { hostNote: false });
    var body = '<div class="field"><label for="w-p">Who can see it</label>' + picker + "</div>" +
      '<p class="hncog-unenforced">Not enforced yet</p><p class="hncog-err" hidden></p>';
    root.dialog("Visibility", body,
      '<button class="btn" data-act="closedlg">Cancel</button><button class="btn primary" data-act="hncog-save">Save</button>',
      480, "hncog");
    var dlg = root.DLGS && root.DLGS[root.DLGS.length - 1];
    if (dlg) dlg._hncog = session;
  }

  function showError(dlg, err) {
    var node = dlg && dlg.querySelector && dlg.querySelector(".hncog-err");
    if (!node) return;
    node.hidden = false;
    node.textContent = (err && err.message) || (typeof err === "string" && err) || "Couldn't save";
  }

  function saveOpen() {
    var dlg = root.DLGS && root.DLGS[root.DLGS.length - 1];
    var session = dlg && dlg._hncog;
    if (!session || session.saving) return;
    var aud = root.HNAudience ? root.HNAudience.normalize((root.DRAFT && root.DRAFT.audience) || session.aud) : session.aud;
    session.saving = true;
    Promise.resolve(session.spec.saveAudience(aud)).then(function () {
      session.saving = false;
      if (typeof session.spec.onChange === "function") session.spec.onChange(aud);
      if (typeof root.closeDialogs === "function") root.closeDialogs();
    }, function (err) {
      session.saving = false;
      showError(dlg, err);
    });
  }

  function mount(el, spec) {
    spec = spec || {};
    if (!spec.canEdit) return function () {};
    if (spec.kind !== "event" && typeof spec.saveAudience !== "function") {
      throw new Error("HNCog.mount needs saveAudience for a horizon");
    }
    var session = { el: el, spec: spec, aud: null, saving: false };
    write(el, session);
    return function off() { drop(el, session); };
  }

  function open(el) {
    var session = read(el);
    if (!session || typeof root.openItemMenu !== "function") return;
    var title = session.spec.kind === "event" ? "Admin controls" : (session.spec.title || "Visibility");
    root.openItemMenu(el, session.spec.id, menuFor(session), { title: title });
  }

  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("click", function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('[data-act="hncog-save"]');
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
      saveOpen();
    }, true);
  }

  var api = { mount: mount, open: open };
  root.HNCog = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
