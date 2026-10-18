/* Relationship face. A follow is a directed edge. A friendship is one undirected row.
   The two are independent, so the state is a product, not one enum that hides a follow. */
(function (root) {
  "use strict";

  var FRIENDGRAPH = {};
  var RELDLG = null;

  function pairKey(a, b) { return root.HNAudience.pairKey(a, b); }
  function low(id) { return String(id || "").toLowerCase(); }

  function relOf(me, them, graph) {
    if (!me || !them || low(me) === low(them)) return { following: false, friend: "friend-none" };
    var follows = (graph && graph.follows) || {};
    var friends = (graph && graph.friends) || {};
    var row = friends[pairKey(me, them)];
    var friend = "friend-none";
    if (row && row.status === "accepted") friend = "friends";
    else if (row && row.status === "pending" && low(row.requestedBy) === low(me)) friend = "requested-out";
    else if (row && row.status === "pending") friend = "requested-in";
    return { following: !!follows[low(me) + "|" + low(them)], friend: friend };
  }

  function kind(rel) {
    if (rel.friend !== "friend-none") return rel.friend;
    return rel.following ? "following" : "none";
  }

  function graph() {
    var follows = {};
    var net = root.NETFOLLOWS || {};
    Object.keys(net).forEach(function (a) {
      (net[a] || []).forEach(function (b) { follows[low(a) + "|" + low(b)] = true; });
    });
    var me = typeof root.myPid === "function" ? root.myPid() : null;
    var pf = root.PFOLLOW || {};
    if (me) Object.keys(pf).forEach(function (b) { if (pf[b]) follows[low(me) + "|" + low(b)] = true; });
    return { follows: follows, friends: FRIENDGRAPH };
  }

  function audienceGraph() {
    var g = graph();
    var friends = {};
    Object.keys(g.friends).forEach(function (k) { friends[k] = g.friends[k].status; });
    return { follows: g.follows, friends: friends, lists: {} };
  }

  function friendIds(pid) {
    var want = low(pid);
    var out = [];
    Object.keys(FRIENDGRAPH).forEach(function (k) {
      var row = FRIENDGRAPH[k];
      if (!row || row.status !== "accepted") return;
      var parts = k.split("|");
      if (parts[0] === want) out.push(row.b && low(row.b) === parts[1] ? row.b : parts[1]);
      else if (parts[1] === want) out.push(row.a && low(row.a) === parts[0] ? row.a : parts[0]);
    });
    return out;
  }

  function countsOf(pid) {
    var people = root.PEOPLE || {};
    var p = people[pid];
    if (p && typeof p.followerCount === "number" && typeof p.followingCount === "number" && typeof p.friendCount === "number") {
      return { followers: p.followerCount, following: p.followingCount, friends: p.friendCount };
    }
    var g = graph();
    var want = low(pid);
    var followers = 0, following = 0;
    Object.keys(g.follows).forEach(function (k) {
      var parts = k.split("|");
      if (parts[1] === want) followers++;
      if (parts[0] === want) following++;
    });
    var friends = 0;
    Object.keys(FRIENDGRAPH).forEach(function (k) {
      var row = FRIENDGRAPH[k];
      if (row && row.status === "accepted" && (low(row.a) === want || low(row.b) === want || k.split("|").indexOf(want) >= 0)) friends++;
    });
    return { followers: followers, following: following, friends: friends };
  }

  function icon(d) {
    return '<svg class="ic" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="' + d + '"/></svg>';
  }
  var PLUS = icon("M8 3v10M3 8h10");
  var CHECK = icon("M3.5 8.5l3 3 6-6.5");

  function relActionsHTML(pid, opts) {
    var o = opts || {};
    var me = typeof root.myPid === "function" ? root.myPid() : null;
    if (!pid || pid === "self" || (me && low(pid) === low(me))) return "";
    var rel = relOf(me, pid, graph());
    var n = countsOf(pid);
    var logged = root.S && root.S.loggedIn;
    var follow = '<button type="button" class="btn" data-act="followp" data-id="' + pid + '">' +
      (rel.following ? CHECK + "Unfollow" : PLUS + "Follow") + "</button>";
    var friend = "";
    if (rel.friend === "requested-out") friend = '<button type="button" class="btn" data-rel-act="rel-cancel" data-id="' + pid + '">Requested</button>';
    else if (rel.friend === "requested-in") {
      friend = '<button type="button" class="btn primary" data-rel-act="rel-accept" data-id="' + pid + '">Accept</button>' +
        '<button type="button" class="btn" data-rel-act="rel-decline" data-id="' + pid + '">Decline</button>';
    } else if (rel.friend === "friends") friend = '<button type="button" class="btn" data-rel-act="rel-unfriend" data-id="' + pid + '">' + CHECK + "Friends</button>";
    else friend = '<button type="button" class="btn" data-rel-act="rel-friend" data-id="' + pid + '">' + PLUS + "Add friend</button>";
    var countBtn = function (list, label, num) {
      if (list === "friends" && logged && me && low(pid) !== low(me)) return '<span>' + num + " " + label + "</span>";
      return '<button type="button" data-rel-act="rel-list" data-id="' + pid + '" data-list="' + list + '">' + num + " " + label + "</button>";
    };
    var counts = '<div class="relcounts">' + countBtn("followers", n.followers === 1 ? "follower" : "followers", n.followers) +
      countBtn("following", "following", n.following) + countBtn("friends", n.friends === 1 ? "friend" : "friends", n.friends) + "</div>";
    return '<div class="relacts' + (o.density === "compact" ? " compact" : "") + '" data-kind="' + kind(rel) + '">' +
      counts + '<div class="relbtns">' + follow + friend + "</div></div>";
  }

  function mount(scope) {
    var rootEl = scope || (typeof document !== "undefined" ? document : null);
    if (!rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll(".profile-actions").forEach(function (el) {
      var pid = el.getAttribute("data-pid");
      el.innerHTML = relActionsHTML(pid, { density: el.getAttribute("data-rel") || "full" });
    });
  }

  function bump(pid, key, d) {
    var p = root.PEOPLE && root.PEOPLE[pid];
    if (p && typeof p[key] === "number") p[key] = Math.max(0, p[key] + d);
  }
  function noteFollow(pid, on) {
    var me = typeof root.myPid === "function" ? root.myPid() : null;
    var d = on ? 1 : -1;
    bump(pid, "followerCount", d);
    if (me) bump(me, "followingCount", d);
    var p = root.PEOPLE && root.PEOPLE[pid];
    if (!p || !Array.isArray(p.followedBy) || !me) return;
    var i = p.followedBy.indexOf(me);
    if (on && i < 0) p.followedBy.unshift(me);
    if (!on && i >= 0) p.followedBy.splice(i, 1);
    if (p.followedBy.length > 3) p.followedBy.length = 3;
  }
  function noteFriends(me, them, d) { bump(me, "friendCount", d); bump(them, "friendCount", d); }

  function putBond(me, them, status, requestedBy) {
    FRIENDGRAPH[pairKey(me, them)] = { a: me, b: them, requestedBy: requestedBy, status: status };
  }

  function dropBond(me, them) { delete FRIENDGRAPH[pairKey(me, them)]; }

  function afterWrite() {
    if (typeof root.render === "function") root.render();
    refreshDlg();
  }

  function requestFriend(pid) {
    var me = root.myPid();
    if (!me || low(pid) === low(me)) return;
    var rel = relOf(me, pid, graph());
    if (rel.friend === "requested-in") return acceptFriend(pid);
    if (rel.friend !== "friend-none") return;
    putBond(me, pid, "pending", me);
    if (root.ONLINE && root.HNAPI && root.HNAPI.friendWrite) root.HNAPI.friendWrite(pid, "PUT");
    afterWrite();
    root.toast("Friend request sent", root.person(pid).displayName);
  }

  function acceptFriend(pid) {
    var me = root.myPid();
    var row = FRIENDGRAPH[pairKey(me, pid)];
    var was = row && row.status === "accepted";
    putBond(me, pid, "accepted", row ? row.requestedBy : pid);
    if (!was) noteFriends(me, pid, 1);
    if (root.ONLINE && root.HNAPI && root.HNAPI.friendWrite) root.HNAPI.friendWrite(pid, "PUT");
    afterWrite();
    root.toast("Friends", root.person(pid).displayName);
  }

  function deleteFriend(pid) {
    var me = root.myPid();
    var row = FRIENDGRAPH[pairKey(me, pid)];
    if (row && row.status === "accepted") noteFriends(me, pid, -1);
    dropBond(me, pid);
    if (root.ONLINE && root.HNAPI && root.HNAPI.friendWrite) root.HNAPI.friendWrite(pid, "DELETE");
    afterWrite();
    root.toast("Friendship removed", root.person(pid).displayName);
  }

  function toggleFollow(pid) {
    var was = !!root.PFOLLOW[pid];
    if (!(root.RESUMING && root.PFOLLOW[pid])) root.PFOLLOW[pid] = !root.PFOLLOW[pid];
    if (root.PFOLLOW[pid] !== was) noteFollow(pid, !!root.PFOLLOW[pid]);
    if (root.PFOLLOW[pid] && typeof root.logAct === "function") root.logAct("followed_person", "person", pid);
    if (root.ONLINE && root.HNAPI) root.HNAPI.followPerson(pid);
    if (typeof root.render === "function") root.render();
    root.toast(root.PFOLLOW[pid] ? "Following" : "Unfollowed", root.person(pid).displayName);
  }

  function incomingCount() {
    var me = typeof root.myPid === "function" ? root.myPid() : null;
    if (!me) return 0;
    var n = 0;
    Object.keys(FRIENDGRAPH).forEach(function (k) {
      var row = FRIENDGRAPH[k];
      if (!row || row.status !== "pending" || low(row.requestedBy) === low(me)) return;
      var parts = k.split("|");
      if (parts.indexOf(low(me)) >= 0) n++;
    });
    return n;
  }

  function requestsButton() {
    if (!root.S || !root.S.loggedIn) return "";
    var me = typeof root.myPid === "function" ? root.myPid() : "";
    var n = incomingCount();
    return '<div class="relbar"><button type="button" class="btn" data-rel-act="rel-requests">Requests' +
      (n ? '<span class="rel-badge">' + n + "</span>" : "") + "</button>" +
      '<button type="button" class="btn" data-rel-act="rel-list" data-id="' + me + '" data-list="friends">Friends</button>' +
      '<button type="button" class="btn" data-rel-act="rel-list" data-id="' + me + '" data-list="followers">Followers</button></div>';
  }

  function otherOf(row, me) {
    return low(row.a) === low(me) ? row.b : row.a;
  }

  function requestsHTML() {
    var me = root.myPid();
    var inn = [], out = [];
    Object.keys(FRIENDGRAPH).forEach(function (k) {
      var row = FRIENDGRAPH[k];
      if (!row || row.status !== "pending") return;
      var parts = k.split("|");
      if (parts.indexOf(low(me)) < 0 && low(row.a) !== low(me) && low(row.b) !== low(me)) return;
      var other = otherOf(row, me);
      if (low(row.requestedBy) === low(me)) out.push(other); else inn.push(other);
    });
    var line = function (pid, buttons) {
      var p = root.person(pid);
      return '<div class="relrow"><span>' + root.esc(p.displayName) + " <small>@" + root.esc(p.handle) + "</small></span>" + buttons + "</div>";
    };
    var h = "";
    h += "<h3>Incoming</h3>";
    h += inn.length ? inn.map(function (pid) {
      return line(pid, '<span class="relbtns"><button type="button" class="btn primary" data-rel-act="rel-accept" data-id="' + pid + '">Accept</button>' +
        '<button type="button" class="btn" data-rel-act="rel-decline" data-id="' + pid + '">Decline</button></span>');
    }).join("") : '<p class="relempty">No incoming requests.</p>';
    h += "<h3>Outgoing</h3>";
    h += out.length ? out.map(function (pid) {
      return line(pid, '<button type="button" class="btn" data-rel-act="rel-cancel" data-id="' + pid + '">Cancel</button>');
    }).join("") : '<p class="relempty">No outgoing requests.</p>';
    return h;
  }

  function namesFromGraph(pid, list) {
    var me = typeof root.myPid === "function" ? root.myPid() : null;
    var subject = pid === "self" ? me : pid;
    if (list === "friends") {
      if (!me || low(subject) !== low(me)) return null;
      return friendIds(me).map(nameOf);
    }
    var want = low(subject);
    var ids = [];
    Object.keys(graph().follows).forEach(function (k) {
      var parts = k.split("|");
      if (list === "followers" && parts[1] === want) ids.push(parts[0]);
      if (list === "following" && parts[0] === want) ids.push(parts[1]);
    });
    return ids.map(nameOf);
  }

  function nameOf(id) {
    var people = root.PEOPLE || {};
    var p = people[id];
    return { id: id, displayName: p ? p.displayName : id, handle: p ? p.handle : "" };
  }

  function listHTML(names, hidden) {
    if (hidden) return '<p class="relempty">Friend lists are on your own page.</p>';
    if (!names || !names.length) return '<p class="relempty">No one here.</p>';
    return names.map(function (p) {
      return '<div class="relrow"><button type="button" class="btn" data-act="row" data-type="person" data-id="' + p.id + '">' +
        root.esc(p.displayName) + "</button><small>@" + root.esc(p.handle) + "</small></div>";
    }).join("");
  }

  function openDialog(title, html, meta) {
    RELDLG = meta;
    var d = root.dialog(title, html, '<button class="btn" data-act="closedlg">Close</button>', 420, "rel-dlg");
    if (d) d.setAttribute("data-rel-dlg", meta.mode);
  }

  function refreshDlg() {
    if (!RELDLG || typeof document === "undefined") return;
    var d = document.querySelector(".dlg.rel-dlg");
    if (!d) { RELDLG = null; return; }
    var body = d.querySelector(".dbody");
    if (!body) return;
    if (RELDLG.mode === "requests") body.innerHTML = requestsHTML();
    else body.innerHTML = listHTML(RELDLG.names, RELDLG.hidden);
  }

  function openRequests() {
    if (!root.S.loggedIn) { root.loginDialog(); return; }
    openDialog("Requests", requestsHTML(), { mode: "requests" });
  }

  function openList(pid, list) {
    if (!root.S.loggedIn) { root.loginDialog(); return; }
    var title = list === "followers" ? "Followers" : list === "following" ? "Following" : "Friends";
    var me = root.myPid();
    if (list === "friends" && low(pid) !== low(me) && pid !== "self") {
      openDialog(title, listHTML(null, true), { mode: "list", names: null, hidden: true });
      return;
    }
    var local = namesFromGraph(pid, list);
    openDialog(title, listHTML(local, false), { mode: "list", names: local, hidden: false });
    if (root.ONLINE && root.HNAPI && root.HNAPI.relations) {
      root.HNAPI.relations(pid === "self" ? me : pid).then(function (d) {
        var names = d[list];
        if (list === "friends" && names == null) {
          RELDLG = { mode: "list", names: null, hidden: true };
        } else {
          RELDLG = { mode: "list", names: names || [], hidden: false };
        }
        refreshDlg();
      });
    }
  }

  function onClick(ev) {
    var b = ev.target.closest && ev.target.closest("[data-rel-act]");
    if (!b) return;
    ev.preventDefault();
    ev.stopPropagation();
    var act = b.getAttribute("data-rel-act");
    var pid = b.getAttribute("data-id");
    var go = function (fn) { root.gated(fn)(pid); };
    if (act === "rel-requests") openRequests();
    else if (act === "rel-list") openList(pid, b.getAttribute("data-list"));
    else if (act === "rel-friend") go(requestFriend);
    else if (act === "rel-accept") go(acceptFriend);
    else if (act === "rel-decline" || act === "rel-cancel" || act === "rel-unfriend") go(deleteFriend);
  }

  function ingestRows(rows) {
    FRIENDGRAPH = {};
    (rows || []).forEach(function (f) {
      if (!f || !f.a || !f.b || (f.status !== "accepted" && f.status !== "pending")) return;
      FRIENDGRAPH[pairKey(f.a, f.b)] = { a: f.a, b: f.b, requestedBy: f.requestedBy, status: f.status };
    });
  }

  function ingest(d) { ingestRows(d && d.friendships); }

  function ingestFixtures() {
    var H = root.HYPERNET || {};
    ingestRows(H.bonds || []);
  }

  var api = {
    relOf: relOf, kind: kind, graph: graph, audienceGraph: audienceGraph, friendIds: friendIds, countsOf: countsOf,
    relActionsHTML: relActionsHTML, mount: mount, toggleFollow: toggleFollow,
    requestFriend: requestFriend, acceptFriend: acceptFriend, deleteFriend: deleteFriend,
    incomingCount: incomingCount, requestsButton: requestsButton, openRequests: openRequests, openList: openList,
    ingest: ingest, ingestFixtures: ingestFixtures
  };
  root.HNRel = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof document !== "undefined") document.addEventListener("click", onClick, true);
  if (root.HYPERNET && root.HYPERNET.bonds) ingestFixtures();
})(typeof window !== "undefined" ? window : globalThis);
