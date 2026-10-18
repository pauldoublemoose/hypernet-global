/* Relationship face. A follow is a directed edge. A friendship is one undirected row.
   The two are independent, so the state is a product, not one enum that hides a follow.
   A contact list is a name the owner keeps, with the people on it. Nobody else loads it. */
(function (root) {
  "use strict";

  var FRIENDGRAPH = {};
  var LISTS = [];
  var RELDLG = null;
  var NAME_MAX = 40;
  var LIST_CAP = 50;

  function trimName(name) { return String(name == null ? "" : name).trim(); }

  function nameProblem(lists, name, exceptId) {
    var n = trimName(name);
    if (!n || n.length > NAME_MAX) return "Use a name of 1 to 40 characters.";
    if ((lists || []).some(function (l) { return l.id !== exceptId && String(l.name).toLowerCase() === n.toLowerCase(); })) return "You already have a list with that name.";
    if (!exceptId && (lists || []).length >= LIST_CAP) return "You can keep 50 lists.";
    return "";
  }

  function blockingEvents(events, listId) {
    var token = "list:" + listId;
    var out = [];
    (events || []).forEach(function (e) {
      var ex = e && e.audience && e.audience.exclude;
      if (Array.isArray(ex) && ex.indexOf(token) >= 0) out.push({ id: e.id, title: e.title || "" });
    });
    return out;
  }

  function planDelete(lists, events, listId) {
    var blocked = blockingEvents(events, listId);
    if (blocked.length) return { ok: false, events: blocked };
    var token = "list:" + listId;
    var nextEvents = (events || []).map(function (e) {
      if (!e || !e.audience || !Array.isArray(e.audience.include) || e.audience.include.indexOf(token) < 0) return e;
      return Object.assign({}, e, { audience: Object.assign({}, e.audience, {
        include: e.audience.include.filter(function (t) { return t !== token; })
      }) });
    });
    return { ok: true, lists: (lists || []).filter(function (l) { return l.id !== listId; }), events: nextEvents };
  }

  function memberToggle(lists, listId, personId) {
    return (lists || []).map(function (l) {
      if (l.id !== listId) return l;
      var ids = (l.memberIds || []).slice();
      var i = ids.indexOf(personId);
      if (i >= 0) ids.splice(i, 1); else ids.push(personId);
      return { id: l.id, name: l.name, memberIds: ids, createdAt: l.createdAt };
    });
  }

  function knownIds(me, bag) {
    var seen = {};
    var out = [];
    var mine = low(me);
    function add(id) {
      if (!id || id === "self" || low(id) === mine) return;
      if (seen[id]) return;
      seen[id] = true;
      out.push(id);
    }
    ["following", "followers", "friends", "pending", "listed"].forEach(function (k) {
      ((bag && bag[k]) || []).forEach(add);
    });
    return out;
  }

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
    var lists = {};
    var owner = typeof root.myPid === "function" ? root.myPid() : null;
    LISTS.forEach(function (l) {
      var members = {};
      (l.memberIds || []).forEach(function (id) { members[id] = true; });
      lists[l.id] = { owner: owner, members: members };
    });
    return { follows: g.follows, friends: friends, lists: lists };
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
    var addTo = '<button type="button" class="btn" data-rel-act="rel-addto" data-id="' + pid + '">' + PLUS + "Add to list</button>";
    return '<div class="relacts' + (o.density === "compact" ? " compact" : "") + '" data-kind="' + kind(rel) + '">' +
      counts + '<div class="relbtns">' + follow + friend + addTo + "</div></div>";
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
      '<button type="button" class="btn" data-rel-act="rel-list" data-id="' + me + '" data-list="followers">Followers</button>' +
      '<button type="button" class="btn" data-rel-act="rel-lists-home">Lists</button></div>';
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

  function dialogTitle() {
    if (!RELDLG) return "";
    if (RELDLG.mode === "requests") return "Requests";
    if (RELDLG.mode === "lists") return "Lists";
    if (RELDLG.mode === "members") { var l = listById(RELDLG.listId); return l ? l.name : "List"; }
    if (RELDLG.mode === "rename") return "Rename";
    if (RELDLG.mode === "add") return "Add people";
    if (RELDLG.mode === "addto") return "Add to list";
    if (RELDLG.mode === "blocked") return "This list is in use";
    if (RELDLG.mode === "confirm-delete") return "Delete list";
    if (RELDLG.mode === "list") return RELDLG.title || "";
    return "";
  }

  function dialogBody() {
    if (!RELDLG) return "";
    if (RELDLG.mode === "requests") return requestsHTML();
    if (RELDLG.mode === "lists") return listsHomeHTML();
    if (RELDLG.mode === "members") return membersHTML(RELDLG.listId);
    if (RELDLG.mode === "rename") return renameHTML(RELDLG.listId);
    if (RELDLG.mode === "add") return addPeopleHTML(RELDLG.listId, RELDLG.q || "");
    if (RELDLG.mode === "addto") return addToHTML(RELDLG.pid);
    if (RELDLG.mode === "blocked") return blockedHTML(RELDLG.events);
    if (RELDLG.mode === "confirm-delete") return confirmDeleteHTML(RELDLG.listId);
    return listHTML(RELDLG.names, RELDLG.hidden);
  }

  function refreshDlg() {
    if (!RELDLG || typeof document === "undefined") return;
    var d = document.querySelector(".dlg.rel-dlg");
    if (!d) { RELDLG = null; return; }
    var body = d.querySelector(".dbody");
    if (!body) return;
    var focusQ = RELDLG.mode === "add" && document.activeElement && document.activeElement.id === "rel-q";
    body.innerHTML = dialogBody();
    var title = d.querySelector(".dtitle");
    if (title && dialogTitle()) title.textContent = dialogTitle();
    d.setAttribute("data-rel-dlg", RELDLG.mode);
    if (focusQ) { var q = document.getElementById("rel-q"); if (q) q.focus(); }
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

  function listById(id) {
    for (var i = 0; i < LISTS.length; i++) if (LISTS[i].id === id) return LISTS[i];
    return null;
  }

  function copyList(l) {
    if (!l || !l.id || typeof l.name !== "string" || !trimName(l.name)) return null;
    return { id: String(l.id), name: trimName(l.name), memberIds: (l.memberIds || []).map(String), createdAt: l.createdAt };
  }

  function listsSnapshot() {
    return LISTS.map(function (l) { return { id: l.id, name: l.name, memberIds: (l.memberIds || []).slice(), createdAt: l.createdAt }; });
  }

  function errLine() {
    return RELDLG && RELDLG.error ? '<p class="relerr">' + root.esc(RELDLG.error) + "</p>" : "";
  }

  function listsHomeHTML() {
    var rows = LISTS.map(function (l) {
      var n = (l.memberIds || []).length;
      return '<div class="relrow"><button type="button" class="btn" data-rel-act="rel-open-list" data-id="' + l.id + '">' + root.esc(l.name) + "</button>" +
        "<span>" + n + (n === 1 ? " person" : " people") + "</span>" +
        '<span class="relbtns"><button type="button" class="btn" data-rel-act="rel-rename" data-id="' + l.id + '">Rename</button>' +
        '<button type="button" class="btn" data-rel-act="rel-delete" data-id="' + l.id + '">Delete</button></span></div>';
    }).join("") || '<p class="relempty">No lists yet.</p>';
    var draft = RELDLG && RELDLG.draft ? root.esc(RELDLG.draft) : "";
    return errLine() + rows +
      '<form class="relcreate"><div class="field"><label for="rel-name">New list</label>' +
      '<input id="rel-name" maxlength="40" autocomplete="off" value="' + draft + '"></div>' +
      '<button type="submit" class="btn primary" data-rel-act="rel-create">Create</button></form>';
  }

  function membersHTML(id) {
    var l = listById(id);
    if (!l) return '<p class="relempty">That list is gone.</p><button type="button" class="btn" data-rel-act="rel-lists-home">All lists</button>';
    var rows = (l.memberIds || []).map(function (pid) {
      var p = nameOf(pid);
      return '<div class="relrow"><span>' + root.esc(p.displayName) + " <small>@" + root.esc(p.handle) + "</small></span>" +
        '<button type="button" class="btn" data-rel-act="rel-remove-member" data-id="' + pid + '" data-list="' + id + '">Remove</button></div>';
    }).join("") || '<p class="relempty">No one in this list.</p>';
    return errLine() + '<button type="button" class="btn" data-rel-act="rel-lists-home">All lists</button>' + rows +
      '<button type="button" class="btn" data-rel-act="rel-add-people" data-id="' + id + '">' + PLUS + "Add people</button>";
  }

  function renameHTML(id) {
    var l = listById(id);
    var value = RELDLG && RELDLG.draft != null ? RELDLG.draft : (l ? l.name : "");
    return errLine() + '<div class="field"><label for="rel-name">Name</label><input id="rel-name" maxlength="40" autocomplete="off" value="' + root.esc(value) + '"></div>' +
      '<div class="relbtns"><button type="button" class="btn primary" data-rel-act="rel-rename-save" data-id="' + id + '">Save</button>' +
      '<button type="button" class="btn" data-rel-act="rel-lists-home">Cancel</button></div>';
  }

  function liveKnown() {
    var me = typeof root.myPid === "function" ? root.myPid() : null;
    var g = graph();
    var following = [], followers = [];
    Object.keys(g.follows).forEach(function (k) {
      var parts = k.split("|");
      if (me && parts[0] === low(me)) following.push(parts[1]);
      if (me && parts[1] === low(me)) followers.push(parts[0]);
    });
    var pending = [];
    Object.keys(FRIENDGRAPH).forEach(function (k) {
      var row = FRIENDGRAPH[k];
      if (!row || row.status === "accepted") return;
      if (me && (low(row.a) === low(me) || low(row.b) === low(me) || k.split("|").indexOf(low(me)) >= 0)) pending.push(low(row.a) === low(me) ? row.b : row.a);
    });
    var listed = [];
    LISTS.forEach(function (l) { (l.memberIds || []).forEach(function (id) { listed.push(id); }); });
    return knownIds(me, { following: following, followers: followers, friends: friendIds(me), pending: pending, listed: listed });
  }

  function pickRows(listId, q) {
    var l = listById(listId);
    var have = {};
    ((l && l.memberIds) || []).forEach(function (id) { have[id] = true; });
    var needle = String(q || "").trim().toLowerCase();
    var ids = liveKnown().filter(function (id) {
      if (have[id]) return false;
      if (!needle) return true;
      var p = nameOf(id);
      return (p.displayName || "").toLowerCase().indexOf(needle) >= 0 || (p.handle || "").toLowerCase().indexOf(needle) >= 0;
    }).sort(function (a, b) {
      return (nameOf(a).displayName || "").localeCompare(nameOf(b).displayName || "");
    });
    if (!ids.length) return '<p class="relempty">Nobody matches.</p>';
    return ids.map(function (pid) {
      var p = nameOf(pid);
      return '<button type="button" class="relcheck" data-rel-act="rel-pick" data-id="' + pid + '" data-list="' + listId + '">' +
        PLUS + "<span>" + root.esc(p.displayName) + " <small>@" + root.esc(p.handle) + "</small></span></button>";
    }).join("");
  }

  function addPeopleHTML(listId, q) {
    return '<button type="button" class="btn" data-rel-act="rel-open-list" data-id="' + listId + '">Back</button>' +
      '<div class="field"><label for="rel-q">People you know</label><input type="search" id="rel-q" value="' + root.esc(q || "") + '" autocomplete="off"></div>' +
      '<div id="rel-pick">' + pickRows(listId, q) + "</div>";
  }

  function addToHTML(pid) {
    if (!LISTS.length) return '<p class="relempty">You have no lists yet.</p><button type="button" class="btn" data-rel-act="rel-lists-home">Lists</button>';
    return LISTS.map(function (l) {
      var on = (l.memberIds || []).indexOf(pid) >= 0;
      return '<button type="button" class="relcheck" data-rel-act="rel-member" data-id="' + pid + '" data-list="' + l.id + '" aria-pressed="' + on + '">' +
        (on ? CHECK : PLUS) + "<span>" + root.esc(l.name) + "</span></button>";
    }).join("");
  }

  function blockedHTML(events) {
    var rows = (events || []).map(function (e) {
      return '<div class="relrow"><span>' + root.esc(e.title || "Untitled") + "</span></div>";
    }).join("");
    return "<p>An event excludes this list, so it stays. Take the list out of that event, then delete it.</p>" + rows +
      '<button type="button" class="btn" data-rel-act="rel-lists-home">Back</button>';
  }

  function confirmDeleteHTML(id) {
    var l = listById(id);
    return "<p>Delete " + root.esc(l ? l.name : "this list") + "?</p>" +
      '<button type="button" class="btn" data-rel-act="rel-delete-yes" data-id="' + id + '">Delete</button>';
  }

  function showLists(extra) {
    var meta = extra || { mode: "lists" };
    if (!document.querySelector(".dlg.rel-dlg")) openDialog("Lists", "", meta);
    else RELDLG = meta;
    refreshDlg();
  }

  function freshId() {
    if (root.ONLINE && root.HNAPI && root.HNAPI.uuid) return root.HNAPI.uuid();
    return "lst-" + Math.random().toString(36).slice(2, 10);
  }

  function hostedEvents() {
    var me = typeof root.myPid === "function" ? root.myPid() : null;
    var ev = root.EVENTS || {};
    return Object.keys(ev).map(function (id) { return ev[id]; }).filter(function (e) {
      if (!e || !me) return false;
      if (e.hostId && low(e.hostId) === low(me)) return true;
      var owners = e.ownerIds || [];
      return owners.indexOf(me) >= 0 || (low(me) === "p-michal" && owners.indexOf("self") >= 0);
    });
  }

  function writeAudiences(events) {
    var live = root.EVENTS || {};
    (events || []).forEach(function (e) {
      if (e && live[e.id] && e.audience && live[e.id] !== e) live[e.id].audience = e.audience;
    });
  }

  function openLists() {
    if (!root.S || !root.S.loggedIn) { root.loginDialog(); return; }
    showLists({ mode: "lists" });
  }

  function createList() {
    var input = typeof document !== "undefined" ? document.getElementById("rel-name") : null;
    var name = input ? input.value : "";
    var problem = nameProblem(LISTS, name);
    if (problem) { showLists({ mode: "lists", error: problem, draft: name }); return; }
    var list = { id: freshId(), name: trimName(name), memberIds: [] };
    LISTS = LISTS.concat([list]);
    showLists({ mode: "lists" });
    if (typeof root.render === "function") root.render();
    if (!(root.ONLINE && root.HNAPI && root.HNAPI.listCreate)) return;
    root.HNAPI.listCreate(list).then(function (res) {
      if (!res || res.ok !== false) return;
      LISTS = LISTS.filter(function (l) { return l.id !== list.id; });
      showLists({ mode: "lists", error: res.message || "Could not create that list.", draft: name });
      if (typeof root.render === "function") root.render();
    });
  }

  function saveRename(id) {
    var input = typeof document !== "undefined" ? document.getElementById("rel-name") : null;
    var name = input ? input.value : "";
    var problem = nameProblem(LISTS, name, id);
    if (problem) { showLists({ mode: "rename", listId: id, error: problem, draft: name }); return; }
    var prev = listById(id);
    var before = prev ? prev.name : "";
    LISTS = LISTS.map(function (l) { return l.id === id ? { id: l.id, name: trimName(name), memberIds: l.memberIds, createdAt: l.createdAt } : l; });
    showLists({ mode: "lists" });
    if (!(root.ONLINE && root.HNAPI && root.HNAPI.listRename)) return;
    root.HNAPI.listRename(id, trimName(name)).then(function (res) {
      if (!res || res.ok !== false) return;
      LISTS = LISTS.map(function (l) { return l.id === id ? { id: l.id, name: before, memberIds: l.memberIds, createdAt: l.createdAt } : l; });
      showLists({ mode: "rename", listId: id, error: res.message || "Could not rename that list.", draft: name });
    });
  }

  function askDelete(id) {
    var plan = planDelete(LISTS, hostedEvents(), id);
    if (!plan.ok) { showLists({ mode: "blocked", listId: id, events: plan.events }); return; }
    showLists({ mode: "confirm-delete", listId: id });
  }

  function commitDelete(id) {
    var plan = planDelete(LISTS, hostedEvents(), id);
    if (!plan.ok) { showLists({ mode: "blocked", listId: id, events: plan.events }); return; }
    var apply = function () {
      LISTS = plan.lists;
      writeAudiences(plan.events);
      showLists({ mode: "lists" });
      if (typeof root.render === "function") root.render();
    };
    if (!(root.ONLINE && root.HNAPI && root.HNAPI.listDelete)) { apply(); return; }
    root.HNAPI.listDelete(id).then(function (res) {
      if (res && res.events && res.events.length) { showLists({ mode: "blocked", listId: id, events: res.events }); return; }
      if (res && res.ok === false) { showLists({ mode: "lists", error: res.message || "Could not delete that list." }); return; }
      apply();
    });
  }

  function setMembers(next, listId, personId, on) {
    LISTS = next;
    var box = RELDLG && RELDLG.mode === "add" && typeof document !== "undefined" && document.getElementById("rel-pick");
    if (box) box.innerHTML = pickRows(listId, RELDLG.q || "");
    else refreshDlg();
    if (!(root.ONLINE && root.HNAPI && root.HNAPI.listMember)) return;
    root.HNAPI.listMember(listId, personId, on).then(function (res) {
      if (!res || res.ok !== false) return;
      LISTS = memberToggle(LISTS, listId, personId);
      if (RELDLG) RELDLG.error = res.message || "Could not update that list.";
      refreshDlg();
    });
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
    else if (act === "rel-lists-home") openLists();
    else if (act === "rel-create") createList();
    else if (act === "rel-open-list") showLists({ mode: "members", listId: pid });
    else if (act === "rel-rename") showLists({ mode: "rename", listId: pid });
    else if (act === "rel-rename-save") saveRename(pid);
    else if (act === "rel-delete") askDelete(pid);
    else if (act === "rel-delete-yes") commitDelete(pid);
    else if (act === "rel-add-people") showLists({ mode: "add", listId: pid, q: "" });
    else if (act === "rel-pick") setMembers(memberToggle(LISTS, b.getAttribute("data-list"), pid), b.getAttribute("data-list"), pid, true);
    else if (act === "rel-remove-member") setMembers(memberToggle(LISTS, b.getAttribute("data-list"), pid), b.getAttribute("data-list"), pid, false);
    else if (act === "rel-addto") go(function (id) { showLists({ mode: "addto", pid: id }); });
    else if (act === "rel-member") {
      var lid = b.getAttribute("data-list");
      var row = listById(lid);
      var on = !(row && (row.memberIds || []).indexOf(pid) >= 0);
      setMembers(memberToggle(LISTS, lid, pid), lid, pid, on);
    }
  }

  function onSearch(ev) {
    if (!RELDLG || RELDLG.mode !== "add" || !ev.target || ev.target.id !== "rel-q") return;
    RELDLG.q = ev.target.value;
    var box = document.getElementById("rel-pick");
    if (box) box.innerHTML = pickRows(RELDLG.listId, RELDLG.q);
  }

  function ingestRows(rows) {
    FRIENDGRAPH = {};
    (rows || []).forEach(function (f) {
      if (!f || !f.a || !f.b || (f.status !== "accepted" && f.status !== "pending")) return;
      FRIENDGRAPH[pairKey(f.a, f.b)] = { a: f.a, b: f.b, requestedBy: f.requestedBy, status: f.status };
    });
  }

  function ingest(d) { ingestRows(d && d.friendships); }

  function ingestLists(rows) {
    LISTS = [];
    (rows || []).forEach(function (l) {
      var c = copyList(l);
      if (c) LISTS.push(c);
    });
  }

  function ingestFixtures() {
    var H = root.HYPERNET || {};
    ingestRows(H.bonds || []);
  }

  var api = {
    relOf: relOf, kind: kind, graph: graph, audienceGraph: audienceGraph, friendIds: friendIds, countsOf: countsOf,
    relActionsHTML: relActionsHTML, mount: mount, toggleFollow: toggleFollow,
    requestFriend: requestFriend, acceptFriend: acceptFriend, deleteFriend: deleteFriend,
    incomingCount: incomingCount, requestsButton: requestsButton, openRequests: openRequests, openList: openList,
    ingest: ingest, ingestFixtures: ingestFixtures, ingestLists: ingestLists, lists: listsSnapshot,
    nameProblem: nameProblem, planDelete: planDelete, memberToggle: memberToggle, knownIds: knownIds
  };
  root.HNRel = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof document !== "undefined") {
    document.addEventListener("click", onClick, true);
    document.addEventListener("input", onSearch);
    document.addEventListener("submit", function (ev) {
      if (ev.target && ev.target.classList && ev.target.classList.contains("relcreate")) ev.preventDefault();
    }, true);
  }
  if (root.HYPERNET && root.HYPERNET.bonds) ingestFixtures();
})(typeof window !== "undefined" ? window : globalThis);
