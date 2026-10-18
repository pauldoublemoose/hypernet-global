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

  var api = { canSee: canSee, inAudience: inAudience, pairKey: pairKey };
  root.HNAudience = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
