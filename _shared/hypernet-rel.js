/* Relationship face. A follow is a directed edge. A friendship is one undirected row.
   The two are independent, so the state is a product, not one enum that hides a follow.
   A contact list is a name the owner keeps, with the people on it. Nobody else loads it. */
(function (root) {
  "use strict";

  var FRIENDGRAPH = {};
  var LISTS = [];
  var RELDLG = null;
  var ADD_PID = null;
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
      var next = {};
      Object.keys(l).forEach(function (k) { next[k] = l[k]; });
      next.memberIds = ids;
      return next;
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

  function rowMark(pid) {
    var me = typeof root.myPid === "function" ? root.myPid() : null;
    if (!me || !pid || pid === "self" || low(pid) === low(me)) return "";
    var k = kind(relOf(me, pid, graph()));
    var label = { friends: "Friends", "requested-out": "Requested", "requested-in": "Incoming", following: "Following" }[k];
    if (!label) return "";
    var filled = k === "friends" || k === "following";
    return '<span class="pill' + (filled ? " going" : "") + '"><span>' + root.esc(label) + "</span></span>";
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
    /* The viewer's own follows are the account's, which start as a copy of their fixture edges.
       Unfollow has to drop a fixture edge, or the profile slot stays on Unfollow. */
    if (me) {
      var prefix = low(me) + "|";
      Object.keys(follows).forEach(function (k) { if (k.slice(0, prefix.length) === prefix) delete follows[k]; });
      Object.keys(pf).forEach(function (b) { if (pf[b]) follows[prefix + low(b)] = true; });
    }
    return { follows: follows, friends: FRIENDGRAPH };
  }

  function audienceGraph() {
    var g = graph();
    var friends = {};
    Object.keys(g.friends).forEach(function (k) { friends[k] = g.friends[k].status; });
    var lists = {};
    var owner = typeof root.myPid === "function" ? root.myPid() : null;
    function putList(id, who, memberIds) {
      if (!id || lists[id]) return;
      var members = {};
      (memberIds || []).forEach(function (m) { members[m] = true; });
      lists[id] = { owner: who, members: members };
    }
    LISTS.forEach(function (l) { putList(l.id, owner, l.memberIds); });
    /* a list token names the host's list. Another account does not carry the demo's lists, so the fixture still does. */
    if (low(owner) !== "p-michal") {
      ((root.HYPERNET && root.HYPERNET.lists) || []).forEach(function (l) { putList(l.id, "p-michal", l.memberIds); });
    }
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

  var MENU = {
    Follow: { cmd: "rel-follow", icon: "plus" },
    Unfollow: { cmd: "rel-unfollow", icon: "close" },
    "Add friend": { cmd: "rel-friend", icon: "plus" },
    "Cancel request": { cmd: "rel-cancel", icon: "close" },
    Accept: { cmd: "rel-accept", icon: "check" },
    Decline: { cmd: "rel-decline", icon: "close" },
    Unfriend: { cmd: "rel-unfriend", icon: "close" },
    "Add to list": { cmd: "rel-addto", icon: "plus" },
    Delete: { cmd: "rel-delete", icon: "trash" }
  };

  function controlOf(rel) {
    var k = kind(rel || { friend: "friend-none", following: false });
    if (k === "friends") return { label: "Friends", tone: "on", items: ["Unfriend", "Add to list"] };
    if (k === "requested-out") return { label: "Requested", tone: "", items: ["Cancel request", "Add to list"] };
    if (k === "requested-in") return { label: "Respond", tone: "primary", items: ["Accept", "Decline", "Add to list"] };
    if (k === "following") return { label: "Following", tone: "on", items: ["Unfollow", "Add friend", "Add to list"] };
    return { label: "Follow", tone: "primary", items: ["Follow", "Add friend", "Add to list"] };
  }

  function glyph(name, sz) {
    if (typeof root.ic !== "function") return "";
    return root.ic(name, sz || 16);
  }

  function menuItems(pid, labels) {
    var items = [];
    labels.forEach(function (label) {
      if (label === "Add to list" && items.length) items.push("-");
      var meta = MENU[label];
      items.push({ label: label, cmd: meta.cmd, arg: pid, icon: meta.icon });
    });
    return items;
  }

  function relActionsHTML(pid, opts) {
    var o = opts || {};
    var me = typeof root.myPid === "function" ? root.myPid() : null;
    if (!pid || pid === "self" || (me && low(pid) === low(me))) return "";
    var rel = relOf(me, pid, graph());
    var spec = controlOf(rel);
    var cls = "btn" + (spec.tone === "primary" ? " primary" : spec.tone === "on" ? " on" : "");
    var caret = glyph("down", 16).replace('class="ic"', 'class="ic caret"');
    var btn = '<button type="button" class="' + cls + '" data-rel-act="rel-menu" data-id="' + pid + '" aria-haspopup="menu">' +
      root.esc(spec.label) + caret + "</button>";
    var counts = "";
    if (o.density !== "compact") {
      var n = countsOf(pid);
      var logged = root.S && root.S.loggedIn;
      var countBtn = function (list, label, num) {
        if (list === "friends" && logged && me && low(pid) !== low(me)) return "<span>" + num + " " + label + "</span>";
        return '<button type="button" data-rel-act="rel-list" data-id="' + pid + '" data-list="' + list + '">' + num + " " + label + "</button>";
      };
      counts = '<div class="relcounts">' + countBtn("followers", n.followers === 1 ? "follower" : "followers", n.followers) +
        countBtn("following", "following", n.following) + countBtn("friends", n.friends === 1 ? "friend" : "friends", n.friends) + "</div>";
    }
    return '<div class="relacts' + (o.density === "compact" ? " compact" : "") + '" data-kind="' + kind(rel) + '">' + counts + btn + "</div>";
  }

  function pagePid(el) {
    var page = el.closest && el.closest(".pg-person");
    if (!page) return "";
    if (page.closest(".pvpage")) return "self";
    var stack = root.S && root.S.stack;
    var top = stack && stack.length ? stack[stack.length - 1] : null;
    return top && top.type === "person" ? top.id : "";
  }

  function mount(scope) {
    var rootEl = scope || (typeof document !== "undefined" ? document : null);
    if (!rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll(".profile-actions").forEach(function (el) {
      var pid = el.getAttribute("data-pid") || pagePid(el);
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

  function openDialog(title, html, meta, foot, width) {
    RELDLG = meta;
    var d = root.dialog(title, html, foot || '<button class="btn" data-act="closedlg">Close</button>', width || 420, "rel-dlg");
    if (d) { d.setAttribute("data-rel-dlg", meta.mode); d._rel = meta; }
  }

  function topRelDlg() {
    if (typeof document === "undefined") return null;
    var all = document.querySelectorAll(".dlg.rel-dlg");
    return all.length ? all[all.length - 1] : null;
  }

  function dialogTitle() {
    if (!RELDLG) return "";
    if (RELDLG.mode === "requests") return "Requests";
    if (RELDLG.mode === "lists") return "Lists";
    if (RELDLG.mode === "create") return "New list";
    if (RELDLG.mode === "edit") return "Edit list";
    if (RELDLG.mode === "add") { var al = listById(RELDLG.listId); return al ? "Add people to " + al.name : "Add people"; }
    if (RELDLG.mode === "addto") { var who = root.person(RELDLG.pid); return "Add “" + ((who && who.displayName) || "them") + "” to"; }
    if (RELDLG.mode === "blocked") return "This list is in use";
    if (RELDLG.mode === "contacts") return "Contacts";
    if (RELDLG.mode === "list") return RELDLG.title || "";
    return "";
  }

  function dialogBody() {
    if (!RELDLG) return "";
    if (RELDLG.mode === "requests") return requestsHTML();
    if (RELDLG.mode === "lists") return listsHomeHTML();
    if (RELDLG.mode === "create" || RELDLG.mode === "edit") return formHTML();
    if (RELDLG.mode === "add") return addPeopleHTML(RELDLG.listId, RELDLG.q || "");
    if (RELDLG.mode === "addto") return addToHTML(RELDLG.pid);
    if (RELDLG.mode === "blocked") return blockedHTML(RELDLG.events);
    if (RELDLG.mode === "contacts") return contactsHTML(RELDLG.names);
    return listHTML(RELDLG.names, RELDLG.hidden);
  }

  function refreshDlg() {
    if (!RELDLG || typeof document === "undefined") return;
    var d = topRelDlg();
    if (!d) { RELDLG = null; return; }
    var body = d.querySelector(".dbody");
    if (!body) return;
    var focusQ = RELDLG.mode === "add" && document.activeElement && document.activeElement.id === "lp-q";
    var selStart = focusQ ? document.activeElement.selectionStart : null;
    body.innerHTML = dialogBody();
    var title = d.querySelector(".dtitle");
    if (title && dialogTitle()) title.textContent = dialogTitle();
    d.setAttribute("data-rel-dlg", RELDLG.mode);
    d._rel = RELDLG;
    var foot = d.querySelector(".dfoot");
    if (foot && RELDLG.mode === "add") foot.innerHTML = addFoot(RELDLG.listId);
    if (focusQ) {
      var q = document.getElementById("lp-q");
      if (q) { q.focus(); try { q.setSelectionRange(selStart, selStart); } catch (e) {} }
    }
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

  function contactNames() {
    var me = typeof root.myPid === "function" ? root.myPid() : null;
    var pid = me || "self";
    return {
      friends: namesFromGraph(pid, "friends") || [],
      followers: namesFromGraph(pid, "followers") || [],
      following: namesFromGraph(pid, "following") || []
    };
  }

  function contactsHTML(names) {
    var n = names || {};
    var band = function (label, body) {
      return '<div class="band">' + root.esc(label) + "</div>" + body;
    };
    var friends = n.friendsHidden ? listHTML(null, true) : listHTML(n.friends || [], false);
    return band("Friends", friends) +
      band("Followers", listHTML(n.followers || [], false)) +
      band("Following", listHTML(n.following || [], false)) +
      band("Lists", listsHomeHTML());
  }

  function openContacts() {
    if (!root.S || !root.S.loggedIn) { if (root.loginDialog) root.loginDialog(); return; }
    var names = contactNames();
    var meta = { mode: "contacts", names: names };
    RELDLG = meta;
    openDialog("Contacts", contactsHTML(names), meta);
    var me = typeof root.myPid === "function" ? root.myPid() : null;
    if (!(root.ONLINE && root.HNAPI && root.HNAPI.relations) || !me) return;
    root.HNAPI.relations(me).then(function (d) {
      if (!RELDLG || RELDLG.mode !== "contacts" || !d) return;
      RELDLG.names = {
        friends: d.friends == null ? null : (d.friends || []),
        followers: d.followers || [],
        following: d.following || [],
        friendsHidden: d.friends == null
      };
      refreshDlg();
    });
  }

  function listById(id) {
    for (var i = 0; i < LISTS.length; i++) if (LISTS[i].id === id) return LISTS[i];
    return null;
  }

  function copyList(l) {
    if (!l || !l.id || typeof l.name !== "string" || !trimName(l.name)) return null;
    var desc = l.description == null ? "" : String(l.description).trim();
    if (desc.length > 2000) desc = desc.slice(0, 2000);
    return { id: String(l.id), name: trimName(l.name), description: desc, memberIds: (l.memberIds || []).map(String), createdAt: l.createdAt };
  }

  function listsSnapshot() {
    return LISTS.map(function (l) {
      return { id: l.id, name: l.name, description: l.description || "", memberIds: (l.memberIds || []).slice(), createdAt: l.createdAt };
    });
  }

  function errLine() {
    return RELDLG && RELDLG.error ? '<p class="relerr">' + root.esc(RELDLG.error) + "</p>" : "";
  }

  function peopleCount(n) { return n + (n === 1 ? " person" : " people"); }

  function listsHomeHTML() {
    var rows = LISTS.map(function (l) {
      var n = (l.memberIds || []).length;
      return '<div class="linkrow" data-rel-act="rel-open-list" data-id="' + l.id + '" role="button"><div class="lr"><b>' +
        root.esc(l.name) + '</b><div class="fhelp">' + peopleCount(n) + "</div></div></div>";
    }).join("");
    return errLine() + '<div class="picklist"><div class="linkrow" data-rel-act="rel-new-list" role="button"><span class="r-ic">' +
      glyph("plus") + '</span><div class="lr"><b>New list</b></div></div>' +
      (rows || '<p class="relempty">No lists yet.</p>') + "</div>";
  }

  function formHTML() {
    var l = RELDLG && RELDLG.listId ? listById(RELDLG.listId) : null;
    var name = RELDLG && RELDLG.draftName != null ? RELDLG.draftName : (l ? l.name : "");
    var desc = RELDLG && RELDLG.draftDesc != null ? RELDLG.draftDesc : (l ? (l.description || "") : "");
    return errLine() +
      '<div class="field"><label for="ll-n">Name</label><input type="text" id="ll-n" maxlength="40" autocomplete="off" value="' + root.esc(name) + '"></div>' +
      '<div class="field"><label for="ll-d">Description</label><textarea id="ll-d" rows="2" maxlength="2000">' + root.esc(desc) + "</textarea></div>";
  }

  function formFoot(mode, id) {
    var go = mode === "edit" ? "Save changes" : "Create list";
    var act = mode === "edit" ? "rel-rename-save" : "rel-create";
    var name = "";
    if (mode === "edit") { var l = listById(id); name = l ? l.name : ""; }
    var disabled = trimName(name) ? "" : " disabled";
    return '<button class="btn" data-act="closedlg">Cancel</button><button class="btn primary" id="ll-go" data-rel-act="' + act + '" data-id="' + (id || "") + '"' + disabled + ">" + go + "</button>";
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

  function candidateIds(listId, q) {
    var l = listById(listId);
    var have = {};
    ((l && l.memberIds) || []).forEach(function (id) { have[id] = true; });
    var needle = String(q || "").trim().toLowerCase();
    return liveKnown().filter(function (id) {
      if (have[id]) return false;
      if (!needle) return true;
      var p = nameOf(id);
      return (p.displayName || "").toLowerCase().indexOf(needle) >= 0 || (p.handle || "").toLowerCase().indexOf(needle) >= 0;
    }).sort(function (a, b) {
      return (nameOf(a).displayName || "").localeCompare(nameOf(b).displayName || "");
    });
  }

  function peopleRows(listId, q) {
    var sel = (RELDLG && RELDLG.sel) || [];
    var ids = candidateIds(listId, q);
    if (!ids.length) return '<div class="empty pkempty">Nobody matches.</div>';
    return ids.map(function (pid) {
      var p = nameOf(pid);
      var on = sel.indexOf(pid) >= 0;
      var av = typeof root.avHTML === "function" ? root.avHTML(pid, "a40") : "";
      return '<label class="pick"><input type="checkbox" data-rel-act="rel-lpick" data-id="' + pid + '" data-list="' + listId + '"' + (on ? " checked" : "") + ">" +
        av + '<span class="pm">' + root.esc(p.displayName) + "<small>@" + root.esc(p.handle) + "</small></span></label>";
    }).join("");
  }

  function addPeopleHTML(listId, q) {
    return '<div class="field pksearch"><input type="search" id="lp-q" value="' + root.esc(q || "") + '" placeholder="Search people" autocomplete="off" aria-label="Search people"></div>' +
      '<div class="picklist tall" id="lp-list">' + peopleRows(listId, q) + "</div>";
  }

  function addFoot(listId) {
    var n = ((RELDLG && RELDLG.sel) || []).length;
    var lab = n ? "Add " + n + (n === 1 ? " person" : " people") : "Add";
    return '<button class="btn" data-act="closedlg">Cancel</button><button class="btn primary" id="lp-go" data-rel-act="rel-add-go" data-id="' + listId + '"' +
      (n ? "" : " disabled") + ">" + root.esc(lab) + "</button>";
  }

  function addToHTML(pid) {
    var rows = LISTS.map(function (l) {
      var on = (l.memberIds || []).indexOf(pid) >= 0;
      var n = (l.memberIds || []).length;
      return '<div class="linkrow" data-rel-act="rel-member" data-id="' + pid + '" data-list="' + l.id + '" role="button"><div class="lr">' +
        root.esc(l.name) + '<div class="fhelp">' + peopleCount(n) + "</div></div>" +
        '<span class="lstate hzchk' + (on ? " on" : "") + '" role="checkbox" aria-checked="' + on + '">' + (on ? glyph("check") : "") + "</span></div>";
    }).join("");
    return '<div class="picklist"><div class="linkrow" data-rel-act="rel-new-list" data-id="' + pid + '" role="button"><span class="r-ic">' +
      glyph("plus") + '</span><div class="lr"><b>New list</b></div></div>' + rows + "</div>";
  }

  function blockedHTML(events) {
    var rows = (events || []).map(function (e) {
      return '<div class="relrow"><span>' + root.esc(e.title || "Untitled") + "</span></div>";
    }).join("");
    return "<p>An event excludes this list, so it stays. Take the list out of that event, then delete it.</p>" + rows +
      '<button type="button" class="btn" data-rel-act="rel-lists-home">Back</button>';
  }

  function listPageHTML(id) {
    var l = listById(id);
    if (!l || typeof root.pageHTML !== "function") return '<div class="empty">This list is gone.</div>';
    var members = l.memberIds || [];
    var tracks = members.map(function (pid) {
      var p = nameOf(pid);
      var av = typeof root.avHTML === "function" ? root.avHTML(pid, "a48") : "";
      return '<li class="track" data-act="open" data-type="person" data-id="' + pid + '" role="button">' + av +
        '<span class="tm"><span class="tt">' + root.esc(p.displayName) + '</span><span class="ts">@' + root.esc(p.handle) + "</span></span>" +
        '<button type="button" class="ib trm" data-rel-act="rel-remove-member" data-id="' + pid + '" data-list="' + id + '" aria-label="Remove ' + root.esc(p.displayName) + '">' +
        glyph("close") + "</button></li>";
    }).join("");
    var body = root.sect("People", '<ol class="tracks">' + (tracks || '<li class="empty">No one in this list yet.</li>') + "</ol>");
    var bar = root.toolbarHTML(
      '<button type="button" class="btn vb primary plmain" data-rel-act="rel-add-people" data-id="' + id + '">' + glyph("plus") + "Add people</button>",
      '<button type="button" class="btn vb" data-rel-act="rel-edit" data-id="' + id + '">' + glyph("edit") + "Edit</button>" +
      '<button type="button" class="btn vb icononly" data-rel-act="rel-list-more" data-id="' + id + '" aria-label="More" aria-haspopup="menu">' + glyph("dots") + "</button>"
    );
    var cover = '<span class="r-ic" style="width:96px;height:96px;flex-basis:96px">' + glyph("user", 36) + "</span>";
    return root.pageHTML({
      kind: "list", t: root.plainTheme("•"), cover: cover, eyebrow: "List · Private", title: l.name,
      sub: l.description ? root.esc(l.description) : "", toolbar: bar,
      facts: root.factGrid([["People", String(members.length)]]), body: body
    });
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

  function hideMaskIfBare() {
    var all = root.DLGS;
    if (all && all.length) return;
    var mask = typeof document !== "undefined" ? document.getElementById("mask") : null;
    if (mask) mask.style.display = "none";
  }

  function closeTop() {
    var all = root.DLGS;
    if (!all || !all.length) return;
    var d = all.pop();
    if (d && d.remove) d.remove();
    var under = all[all.length - 1];
    RELDLG = under && under._rel ? under._rel : null;
    hideMaskIfBare();
  }

  function closeRelDialogs() {
    var all = root.DLGS;
    if (!all) { RELDLG = null; return; }
    var left = [];
    all.forEach(function (d) {
      if (d.classList && d.classList.contains("rel-dlg")) { if (d.remove) d.remove(); }
      else left.push(d);
    });
    all.length = 0;
    left.forEach(function (d) { all.push(d); });
    var under = all[all.length - 1];
    RELDLG = under && under._rel ? under._rel : null;
    hideMaskIfBare();
  }

  function openListPage(id) {
    if (typeof root.openItem === "function") root.openItem("list", id);
    else if (typeof root.render === "function") root.render();
  }

  function fieldVals() {
    var n = typeof document !== "undefined" ? document.getElementById("ll-n") : null;
    var d = typeof document !== "undefined" ? document.getElementById("ll-d") : null;
    return { name: n ? n.value : "", desc: d ? d.value : "" };
  }

  function descProblem(s) {
    if (String(s == null ? "" : s).trim().length > 2000) return "Use a description of at most 2000 characters.";
    return "";
  }

  function showFormError(mode, id, msg, name, desc) {
    RELDLG = { mode: mode, listId: id || null, error: msg, draftName: name, draftDesc: desc };
    var top = topRelDlg();
    if (top) { top._rel = RELDLG; top.setAttribute("data-rel-dlg", mode); }
    refreshDlg();
  }

  function openCreate() {
    RELDLG = { mode: "create", draftName: "", draftDesc: "" };
    openDialog("New list", formHTML(), RELDLG, formFoot("create"), 520);
    if (typeof root.focusIn === "function") root.focusIn("ll-n");
  }

  function openEdit(id) {
    var l = listById(id);
    if (!l) return;
    RELDLG = { mode: "edit", listId: id };
    openDialog("Edit list", formHTML(), RELDLG, formFoot("edit", id), 520);
    if (typeof root.focusIn === "function") root.focusIn("ll-n");
  }

  function openAddPeople(id) {
    var l = listById(id);
    if (!l) return;
    RELDLG = { mode: "add", listId: id, q: "", sel: [] };
    openDialog("Add people to " + l.name, addPeopleHTML(id, ""), RELDLG, addFoot(id), 520);
    if (typeof root.focusIn === "function") root.focusIn("lp-q");
  }

  function openAddTo(pid) {
    var who = typeof root.person === "function" ? root.person(pid) : null;
    RELDLG = { mode: "addto", pid: pid };
    openDialog("Add “" + ((who && who.displayName) || "them") + "” to", addToHTML(pid), RELDLG, '<button class="btn primary" data-act="closedlg">Done</button>', 440);
  }

  function openLists() {
    if (!root.S || !root.S.loggedIn) { if (root.loginDialog) root.loginDialog(); return; }
    var top = topRelDlg();
    if (top && top.getAttribute("data-rel-dlg") === "lists") {
      RELDLG = { mode: "lists" };
      top._rel = RELDLG;
      refreshDlg();
      return;
    }
    RELDLG = { mode: "lists" };
    openDialog("Lists", listsHomeHTML(), RELDLG);
  }

  function stampList(l, name, desc) {
    return { id: l.id, name: name, description: desc, memberIds: l.memberIds || [], createdAt: l.createdAt };
  }

  function finishCreate(list) {
    var addPid = ADD_PID;
    ADD_PID = null;
    if (addPid) {
      LISTS = memberToggle(LISTS, list.id, addPid);
      if (root.ONLINE && root.HNAPI && root.HNAPI.listMember) root.HNAPI.listMember(list.id, addPid, true);
    }
    var wizard = typeof document !== "undefined" && document.querySelector(".dlg.wizdlg, .dlg.edlg");
    closeRelDialogs();
    if (wizard && typeof root.paintWiz === "function") root.paintWiz();
    if (!wizard && addPid) openAddTo(addPid);
    else if (!wizard) openListPage(list.id);
    else if (typeof root.render === "function") root.render();
  }

  function createList() {
    var v = fieldVals();
    var problem = nameProblem(LISTS, v.name) || descProblem(v.desc);
    if (problem) { showFormError("create", null, problem, v.name, v.desc); return; }
    var list = { id: freshId(), name: trimName(v.name), description: String(v.desc || "").trim(), memberIds: [] };
    LISTS = LISTS.concat([list]);
    var go = function () { finishCreate(list); };
    if (!(root.ONLINE && root.HNAPI && root.HNAPI.listCreate)) { go(); return; }
    root.HNAPI.listCreate(list).then(function (res) {
      if (!res || res.ok !== false) { go(); return; }
      LISTS = LISTS.filter(function (l) { return l.id !== list.id; });
      showFormError("create", null, res.message || "Could not create that list.", v.name, v.desc);
    });
  }

  function saveEdit(id) {
    var v = fieldVals();
    var problem = nameProblem(LISTS, v.name, id) || descProblem(v.desc);
    if (problem) { showFormError("edit", id, problem, v.name, v.desc); return; }
    var prev = listById(id);
    if (!prev) return;
    var before = { name: prev.name, description: prev.description || "" };
    var name = trimName(v.name);
    var desc = String(v.desc || "").trim();
    LISTS = LISTS.map(function (l) { return l.id === id ? stampList(l, name, desc) : l; });
    closeTop();
    if (typeof root.render === "function") root.render();
    if (!(root.ONLINE && root.HNAPI && root.HNAPI.listRename)) return;
    root.HNAPI.listRename(id, name, desc).then(function (res) {
      if (!res || res.ok !== false) return;
      LISTS = LISTS.map(function (l) { return l.id === id ? stampList(l, before.name, before.description) : l; });
      if (typeof root.toast === "function") root.toast(res.message || "Could not save that list.", name);
      if (typeof root.render === "function") root.render();
    });
  }

  function askDelete(id) {
    var plan = planDelete(LISTS, hostedEvents(), id);
    if (!plan.ok) {
      RELDLG = { mode: "blocked", listId: id, events: plan.events };
      openDialog("This list is in use", blockedHTML(plan.events), RELDLG);
      return;
    }
    var l = listById(id);
    var name = l ? l.name : "this list";
    if (typeof root.confirmDialog === "function") {
      root.confirmDialog("Delete list", "Delete “" + name + "”? The people stay on Hypernet. The list is gone.", "Delete", function () { commitDelete(id); });
      return;
    }
    commitDelete(id);
  }

  function commitDelete(id) {
    var plan = planDelete(LISTS, hostedEvents(), id);
    if (!plan.ok) {
      RELDLG = { mode: "blocked", listId: id, events: plan.events };
      openDialog("This list is in use", blockedHTML(plan.events), RELDLG);
      return;
    }
    var apply = function () {
      var name = (listById(id) || {}).name || "";
      LISTS = plan.lists;
      writeAudiences(plan.events);
      if (root.S && root.S.stack) root.S.stack = root.S.stack.filter(function (it) { return !(it.type === "list" && it.id === id); });
      RELDLG = null;
      if (typeof root.closeDialogs === "function") root.closeDialogs();
      if (typeof root.render === "function") root.render();
      if (typeof root.toast === "function") root.toast("Deleted", name);
    };
    if (!(root.ONLINE && root.HNAPI && root.HNAPI.listDelete)) { apply(); return; }
    root.HNAPI.listDelete(id).then(function (res) {
      if (res && res.events && res.events.length) {
        RELDLG = { mode: "blocked", listId: id, events: res.events };
        openDialog("This list is in use", blockedHTML(res.events), RELDLG);
        return;
      }
      if (res && res.ok === false) {
        if (typeof root.toast === "function") root.toast(res.message || "Could not delete that list.", "");
        return;
      }
      apply();
    });
  }

  function setMembers(next, listId, personId, on) {
    LISTS = next;
    if (typeof root.render === "function") root.render();
    if (RELDLG && RELDLG.mode !== "add") refreshDlg();
    if (!(root.ONLINE && root.HNAPI && root.HNAPI.listMember)) return;
    root.HNAPI.listMember(listId, personId, on).then(function (res) {
      if (!res || res.ok !== false) return;
      LISTS = memberToggle(LISTS, listId, personId);
      if (RELDLG) RELDLG.error = res.message || "Could not update that list.";
      if (typeof root.render === "function") root.render();
      refreshDlg();
    });
  }

  function addSelected(listId) {
    var ids = ((RELDLG && RELDLG.sel) || []).slice();
    if (!ids.length) return;
    ids.forEach(function (pid) { LISTS = memberToggle(LISTS, listId, pid); });
    closeTop();
    if (typeof root.render === "function") root.render();
    if (!(root.ONLINE && root.HNAPI && root.HNAPI.listMember)) return;
    ids.forEach(function (pid) {
      root.HNAPI.listMember(listId, pid, true).then(function (res) {
        if (!res || res.ok !== false) return;
        LISTS = memberToggle(LISTS, listId, pid);
        if (typeof root.render === "function") root.render();
      });
    });
  }

  function runMenu(cmd, pid) {
    var go = function (fn) { (root.gated ? root.gated(fn) : fn)(pid); };
    if (cmd === "rel-follow" || cmd === "rel-unfollow") {
      if (typeof root.followP === "function") root.followP(pid);
      else go(toggleFollow);
    } else if (cmd === "rel-friend") go(requestFriend);
    else if (cmd === "rel-accept") go(acceptFriend);
    else if (cmd === "rel-decline" || cmd === "rel-cancel" || cmd === "rel-unfriend") go(deleteFriend);
    else if (cmd === "rel-addto") go(function (id) { openAddTo(id); });
    else if (cmd === "rel-delete") askDelete(pid);
  }

  function onClick(ev) {
    var pop = ev.target.closest && ev.target.closest(".popmenu .pi");
    if (pop && !pop.classList.contains("sepi")) {
      var cmd = pop.getAttribute("data-pop") || "";
      if (cmd.indexOf("rel-") === 0) {
        ev.preventDefault();
        ev.stopPropagation();
        var arg = pop.getAttribute("data-arg");
        if (typeof root.closePopup === "function") root.closePopup();
        runMenu(cmd, arg);
        return;
      }
    }
    var b = ev.target.closest && ev.target.closest("[data-rel-act]");
    if (!b || b.tagName === "INPUT") return;
    ev.preventDefault();
    ev.stopPropagation();
    var act = b.getAttribute("data-rel-act");
    var pid = b.getAttribute("data-id");
    var go = function (fn) { (root.gated ? root.gated(fn) : fn)(pid); };
    if (act === "rel-requests") openRequests();
    else if (act === "rel-list") openList(pid, b.getAttribute("data-list"));
    else if (act === "rel-menu") {
      var me = typeof root.myPid === "function" ? root.myPid() : null;
      var spec = controlOf(relOf(me, pid, graph()));
      if (typeof root.popup === "function") root.popup(b, menuItems(pid, spec.items));
    } else if (act === "rel-list-more") {
      if (typeof root.popup === "function") root.popup(b, menuItems(pid, ["Delete"]));
    } else if (act === "rel-lists-home") openLists();
    else if (act === "rel-new-list") { ADD_PID = pid || null; openCreate(); }
    else if (act === "rel-create") createList();
    else if (act === "rel-open-list") { closeRelDialogs(); openListPage(pid); }
    else if (act === "rel-edit") openEdit(pid);
    else if (act === "rel-rename-save") saveEdit(pid);
    else if (act === "rel-delete") askDelete(pid);
    else if (act === "rel-add-people") openAddPeople(pid);
    else if (act === "rel-add-go") addSelected(pid);
    else if (act === "rel-remove-member") setMembers(memberToggle(LISTS, b.getAttribute("data-list"), pid), b.getAttribute("data-list"), pid, false);
    else if (act === "rel-addto") go(openAddTo);
    else if (act === "rel-member") {
      var lid = b.getAttribute("data-list");
      var row = listById(lid);
      var on = !(row && (row.memberIds || []).indexOf(pid) >= 0);
      setMembers(memberToggle(LISTS, lid, pid), lid, pid, on);
    }
  }

  function onSearch(ev) {
    var t = ev.target;
    if (!t) return;
    if (t.id === "ll-n") {
      var goBtn = document.getElementById("ll-go");
      if (goBtn) goBtn.disabled = !trimName(t.value);
      return;
    }
    if (!RELDLG || RELDLG.mode !== "add" || t.id !== "lp-q") return;
    RELDLG.q = t.value;
    var box = document.getElementById("lp-list");
    if (box) box.innerHTML = peopleRows(RELDLG.listId, RELDLG.q);
  }

  function onPick(ev) {
    var b = ev.target;
    if (!b || !b.getAttribute || b.getAttribute("data-rel-act") !== "rel-lpick") return;
    if (!RELDLG || RELDLG.mode !== "add") return;
    var id = b.getAttribute("data-id");
    var sel = RELDLG.sel || (RELDLG.sel = []);
    var i = sel.indexOf(id);
    if (b.checked && i < 0) sel.push(id);
    if (!b.checked && i >= 0) sel.splice(i, 1);
    var foot = document.querySelector(".dlg.rel-dlg .dfoot");
    if (foot) foot.innerHTML = addFoot(RELDLG.listId);
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
    relOf: relOf, kind: kind, rowMark: rowMark, graph: graph, audienceGraph: audienceGraph, friendIds: friendIds, countsOf: countsOf,
    relActionsHTML: relActionsHTML, controlOf: controlOf, listPageHTML: listPageHTML, mount: mount, toggleFollow: toggleFollow,
    requestFriend: requestFriend, acceptFriend: acceptFriend, deleteFriend: deleteFriend,
    incomingCount: incomingCount, requestsButton: requestsButton, openRequests: openRequests, openList: openList,
    openLists: openLists, openContacts: openContacts, contactsHTML: contactsHTML,
    ingest: ingest, ingestFixtures: ingestFixtures, ingestLists: ingestLists, lists: listsSnapshot,
    nameProblem: nameProblem, planDelete: planDelete, memberToggle: memberToggle, knownIds: knownIds
  };
  root.HNRel = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof document !== "undefined") {
    document.addEventListener("click", onClick, true);
    document.addEventListener("input", onSearch);
    document.addEventListener("change", onPick);
    document.addEventListener("submit", function (ev) {
      if (ev.target && ev.target.classList && ev.target.classList.contains("relcreate")) ev.preventDefault();
    }, true);
  }
  if (root.HYPERNET && root.HYPERNET.bonds) ingestFixtures();
})(typeof window !== "undefined" ? window : globalThis);
