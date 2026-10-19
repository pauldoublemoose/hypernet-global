/* Who may see an event. The same rules as can_see / in_audience in db/migrations/0008_friends_privacy.sql.
   A logged-out viewer (null) sees nothing. "everyone" matches any logged-in viewer.
   graph.friends keys are "smaller|larger" uuid text (Postgres uuid order for canonical lowercase ids)
   and the value is "accepted" or "pending". graph.follows keys are "follower|followee".
   graph.lists[id] is { owner, members: { personId: true } }. */
(function (root) {
  "use strict";

  function pairKey(p, q) {
    p = String(p).toLowerCase();
    q = String(q).toLowerCase();
    return p < q ? p + "|" + q : q + "|" + p;
  }

  function friendsOf(id, graph) {
    var out = [];
    var friends = (graph && graph.friends) || {};
    var want = String(id).toLowerCase();
    Object.keys(friends).forEach(function (k) {
      if (friends[k] !== "accepted") return;
      var parts = k.toLowerCase().split("|");
      if (parts[0] === want) out.push(parts[1]);
      else if (parts[1] === want) out.push(parts[0]);
    });
    return out;
  }

  function accepted(viewer, owner, graph) {
    var friends = (graph && graph.friends) || {};
    return friends[pairKey(viewer, owner)] === "accepted";
  }

  function inAudience(viewer, owner, tok, graph) {
    if (tok === "everyone") return viewer != null;
    if (viewer == null || owner == null) return false;
    if (tok === "friends") return accepted(viewer, owner, graph);
    if (tok === "fof") {
      if (viewer === owner) return false;
      if (accepted(viewer, owner, graph)) return true;
      return friendsOf(viewer, graph).some(function (m) {
        return m !== owner && m !== viewer && friendsOf(m, graph).indexOf(String(owner).toLowerCase()) >= 0;
      });
    }
    if (tok === "followers") {
      var follows = (graph && graph.follows) || {};
      return !!follows[String(viewer).toLowerCase() + "|" + String(owner).toLowerCase()];
    }
    if (typeof tok === "string" && tok.indexOf("list:") === 0) {
      var list = ((graph && graph.lists) || {})[tok.slice(5)];
      return !!list && list.owner === owner && !!(list.members && list.members[viewer]);
    }
    return false;
  }

  function canSee(viewer, owner, audience, graph) {
    if (viewer == null) return false;
    if (owner != null && viewer === owner) return true;
    var aud = audience || { include: [], exclude: [] };
    var exclude = aud.exclude || [];
    var include = aud.include || [];
    if (exclude.some(function (tok) { return inAudience(viewer, owner, tok, graph); })) return false;
    return include.some(function (tok) { return inAudience(viewer, owner, tok, graph); });
  }

  var NAMED = ["everyone", "friends", "fof", "followers"];
  var NAMED_LABEL = { everyone: "Everyone", friends: "Friends", fof: "Friends of friends", followers: "Followers" };

  function copyAud(audience) {
    var a = audience || {};
    return { include: (a.include || []).map(String), exclude: (a.exclude || []).map(String) };
  }

  function tokRank(tok) {
    var i = NAMED.indexOf(tok);
    return i < 0 ? NAMED.length : i;
  }

  function sortToks(list) {
    return list.slice().sort(function (a, b) {
      var d = tokRank(a) - tokRank(b);
      return d || (a < b ? -1 : a > b ? 1 : 0);
    });
  }

  function normalize(audience) {
    var a = copyAud(audience);
    var exclude = [];
    a.exclude.forEach(function (t) {
      if (!t || t === "everyone" || exclude.indexOf(t) >= 0) return;
      exclude.push(t);
    });
    var include = [];
    a.include.forEach(function (t) {
      if (!t || exclude.indexOf(t) >= 0 || include.indexOf(t) >= 0) return;
      include.push(t);
    });
    if (include.indexOf("everyone") >= 0) include = ["everyone"];
    return { include: sortToks(include), exclude: sortToks(exclude) };
  }

  function toggle(audience, token, side) {
    var a = normalize(audience);
    if (!token || (side !== "include" && side !== "exclude")) return a;
    if (token === "everyone" && side === "exclude") return a;
    var on = a[side].indexOf(token) >= 0;
    if (on) {
      a[side] = a[side].filter(function (t) { return t !== token; });
      return normalize(a);
    }
    if (side === "include" && token === "everyone") {
      a.include = ["everyone"];
      return normalize(a);
    }
    if (side === "include") {
      a.include = a.include.filter(function (t) { return t !== "everyone" && t !== token; });
      a.include.push(token);
      a.exclude = a.exclude.filter(function (t) { return t !== token; });
    } else {
      a.exclude = a.exclude.filter(function (t) { return t !== token; });
      a.exclude.push(token);
      a.include = a.include.filter(function (t) { return t !== token; });
    }
    return normalize(a);
  }

  function fromPrivacy(p) {
    if (p === "friends") return { include: ["friends"], exclude: [] };
    if (p === "only_me") return { include: [], exclude: [] };
    return { include: ["everyone"], exclude: [] };
  }

  function derivePrivacy(audience) {
    var a = normalize(audience);
    if (a.include.length === 1 && a.include[0] === "everyone" && !a.exclude.length) return "everyone";
    if (!a.include.length) return "only_me";
    return "friends";
  }

  function joinWords(list, nameOf) {
    var words = list.map(function (tok) { return tokenLabel(tok, nameOf); });
    if (words.length <= 1) return words[0] || "";
    if (words.length === 2) return words[0] + " and " + words[1];
    return words.slice(0, -1).join(", ") + ", and " + words[words.length - 1];
  }

  function tokenLabel(tok, nameOf) {
    if (NAMED_LABEL[tok]) return NAMED_LABEL[tok];
    if (tok.indexOf("list:") === 0) {
      var name = nameOf && nameOf(tok.slice(5));
      return name || "a list";
    }
    return tok;
  }

  function summary(audience, nameOf) {
    var a = normalize(audience);
    if (!a.include.length) return "Only you";
    if (a.include.length === 1 && a.include[0] === "everyone") {
      return a.exclude.length ? "Everyone except " + joinWords(a.exclude, nameOf) : "Everyone";
    }
    var inc = joinWords(a.include, nameOf);
    return a.exclude.length ? inc + ", except " + joinWords(a.exclude, nameOf) : inc;
  }

  function escAttr(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function eyeSVG(open) {
    if (open) {
      return '<svg class="ic" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M1.2 10C3.4 6.4 6.3 4.5 10 4.5s6.6 1.9 8.8 5.5c-2.2 3.6-5.1 5.5-8.8 5.5S3.4 13.6 1.2 10zm6 0a2.8 2.8 0 1 0 5.6 0 2.8 2.8 0 0 0-5.6 0z"/></svg>';
    }
    return '<svg class="ic" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1.6 10S4.6 5.2 10 5.2 18.4 10 18.4 10 15.4 14.8 10 14.8 1.6 10 1.6 10z"/><circle cx="10" cy="10" r="2.1"/><path d="M4.2 15.8 15.8 4.2"/></svg>';
  }

  function audBox(side, tok, label, on) {
    var verb = side === "include" ? "Show to " : "Hide from ";
    return '<label class="audbox' + (side === "exclude" ? " ex" : "") + (on ? " on" : "") + '">' +
      '<input type="checkbox" data-aud="' + side + '" data-tok="' + escAttr(tok) + '"' + (on ? " checked" : "") +
      ' aria-label="' + escAttr(verb + label) + '">' + eyeSVG(side === "include") + "</label>";
  }

  function rowHTML(a, r) {
    if (!r || !r.token) return "";
    var inc = a.include.indexOf(r.token) >= 0;
    var exc = a.exclude.indexOf(r.token) >= 0;
    var boxes = audBox("include", r.token, r.label, inc);
    boxes += r.token === "everyone" ? '<span class="audph" aria-hidden="true"></span>' : audBox("exclude", r.token, r.label, exc);
    return '<div class="audrow"><span class="audname">' + escAttr(r.label) + '</span><span class="audboxes">' + boxes + "</span></div>";
  }

  function pickerHTML(audience, rows) {
    var a = normalize(audience);
    var names = {};
    var built = [], lists = [];
    (rows || []).forEach(function (r) {
      if (!r || !r.token) return;
      if (r.token.indexOf("list:") === 0) { names[r.token.slice(5)] = r.label; lists.push(r); }
      else built.push(r);
    });
    var head = '<div class="audrow audhead" aria-hidden="true"><span class="audname"></span><span class="audboxes"><span class="audh">Show</span><span class="audh">Hide</span></span></div>';
    var body = head + built.map(function (r) { return rowHTML(a, r); }).join("");
    if (lists.length) body += '<div class="auddiv" role="separator"></div>' + lists.map(function (r) { return rowHTML(a, r); }).join("");
    body += '<button type="button" class="audmanage" data-rel-act="rel-lists-home">Manage lists</button>';
    return '<div class="audpick" id="w-p" role="group" aria-label="Who can see it">' + body +
      '<p class="audsum">' + escAttr(summary(a, function (id) { return names[id]; })) + "</p></div>";
  }

  var api = {
    canSee: canSee, inAudience: inAudience, pairKey: pairKey,
    normalize: normalize, toggle: toggle, fromPrivacy: fromPrivacy, derivePrivacy: derivePrivacy,
    summary: summary, pickerHTML: pickerHTML
  };
  root.HNAudience = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
