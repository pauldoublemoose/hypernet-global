/* Event request providers for the Requests inbox.
   Registered in order: event_invite, admin_invite, cocreator_request.
   A real provider replaces Friends & Privacy's offline fixture of the same type. */
(function(root){
  var offs = [];
  var done = {};
  var hooked = false;

  function esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function offline(){
    try { return /(?:\?|&)offline=1(?:&|$)/.test(String((root.location && root.location.search) || '')); }
    catch (e) { return false; }
  }
  function me(){
    if (typeof root.myActor === 'function'){ var a = root.myActor(); if (a) return a; }
    if (typeof root.myPid === 'function') return root.myPid();
    return null;
  }
  function bag(name){
    if (!root[name] || typeof root[name] !== 'object') root[name] = {};
    return root[name];
  }
  function changed(){
    var rel = root.HNRel;
    if (rel && typeof rel.requestsChanged === 'function') rel.requestsChanged();
  }
  function personName(pid){
    if (typeof root.person === 'function'){
      var p = root.person(pid);
      if (p && p.displayName) return p.displayName;
    }
    return 'Someone';
  }
  function eventOf(id){ return (root.EVENTS || {})[id] || null; }
  function eventTitle(id){ var e = eventOf(id); return e && e.title || 'an event'; }
  function eventPast(id){
    var e = eventOf(id);
    if (!e) return false;
    if (typeof root.isPast === 'function' && typeof root.lastDay === 'function') return !!root.isPast(root.lastDay(e));
    return false;
  }
  function eventSecondary(id){
    var e = eventOf(id) || {};
    var when = typeof root.fmtShort === 'function' && e.date ? root.fmtShort(e.date) : (e.date || '');
    return [when, e.city || ''].filter(Boolean).join(' · ');
  }
  function eventLine(name, title, past){
    if (past) return name + ' added you to a past event: ' + title;
    return name + ' invited you to attend ' + title;
  }
  function snapRole(evId){
    var rsvp = bag('RSVP'), role = bag('ROLE'), went = bag('WENT');
    return { rsvp: rsvp[evId], role: role[evId], went: went[evId] };
  }
  function restoreRole(evId, snap){
    var rsvp = bag('RSVP'), role = bag('ROLE'), went = bag('WENT');
    if (snap.rsvp) rsvp[evId] = snap.rsvp; else delete rsvp[evId];
    if (snap.role) role[evId] = snap.role; else delete role[evId];
    if (snap.went) went[evId] = snap.went; else delete went[evId];
  }
  function mark(item, verb, snap){
    done[item.id] = { verb: verb, item: item, snap: snap || null };
  }
  function forget(id){ delete done[id]; }

  function face(type, item){
    var title = item.eventTitle || eventTitle(item.eventId);
    var link = '<button type="button" class="hzreq" data-act="openreq" data-type="'+esc(type)+'" data-id="'+esc(item.id)+'">'+esc(title)+'</button>';
    return '<div class="r-main"><div class="r-title">'+esc(item.primary)+'</div>' +
      '<div class="r-meta">'+esc(item.secondary || '')+(item.secondary ? ' · ' : '')+link+'</div></div>';
  }

  function fixtureEvent(id, personId, eventId, past, name, title){
    return {
      id: id, eventId: eventId, personId: personId, direction: 'invite', past: !!past,
      eventTitle: title, primary: eventLine(name, title, past), secondary: past ? title : eventSecondary(eventId) || title
    };
  }
  function fixtureAdmin(id, personId, eventId, name, title){
    return {
      id: id, eventId: eventId, personId: personId, direction: 'invite', past: false,
      eventTitle: title, primary: name + ' invited you to be an admin of ' + title,
      secondary: eventSecondary(eventId) || title
    };
  }
  function fixtureCocreator(id, personId, eventId, direction, name, title){
    var primary = direction === 'invite'
      ? name + ' invited you to co-create ' + title
      : name + ' asked to be listed as a co-creator of ' + title;
    return {
      id: id, eventId: eventId, personId: personId, direction: direction, past: false,
      eventTitle: title, primary: primary, secondary: eventSecondary(eventId) || title
    };
  }

  function offlineEvents(){
    if (!offline()) return [];
    return [
      fixtureEvent('fx-ev-attend', 'p-anna', 'evt-harbour-walk', false, 'Anna Vale', 'Harbour night walk'),
      fixtureEvent('fx-ev-past', 'p-mira', 'evt-chronicle-supper', true, 'Mira Chen', 'Midsummer supper')
    ];
  }
  function offlineAdmins(){
    if (!offline()) return [];
    return [
      fixtureAdmin('fx-ad-rio', 'p-rio', 'evt-dj-night', 'Rio Moss', 'West stage set'),
      fixtureAdmin('fx-ad-kai', 'p-kai', 'evt-deep-listening', 'Kai Okonkwo', 'Deep Listening Lab')
    ];
  }
  function offlineCocreators(){
    if (!offline()) return [];
    return [
      fixtureCocreator('fx-co-req', 'p-kai', 'evt-chronicle-supper', 'request', 'Kai Okonkwo', 'Midsummer supper'),
      fixtureCocreator('fx-co-inv', 'p-sasha', 'evt-harbour-walk', 'invite', 'Sasha Reed', 'Harbour night walk')
    ];
  }

  function liveEvents(){
    var who = me(), out = [], invites = root.EVENT_INVITES || {};
    if (!who) return out;
    Object.keys(invites).forEach(function(evId){
      (invites[evId] || []).forEach(function(row){
        if (!row || row.inviteeId !== who) return;
        var past = eventPast(evId);
        var title = eventTitle(evId);
        out.push({
          id: 'ev:' + evId + ':' + (row.invitedBy || 'x'),
          eventId: evId, personId: row.invitedBy || '', direction: 'invite', past: past,
          eventTitle: title,
          primary: eventLine(personName(row.invitedBy), title, past),
          secondary: eventSecondary(evId) || title
        });
      });
    });
    return out;
  }
  function liveAdmins(){
    var who = me(), out = [], admins = root.EVENT_ADMINS || {};
    if (!who) return out;
    Object.keys(admins).forEach(function(evId){
      (admins[evId] || []).forEach(function(row){
        if (!row || row.userId !== who || row.status !== 'pending') return;
        var title = eventTitle(evId);
        out.push({
          id: 'ad:' + evId,
          eventId: evId, personId: row.invitedBy || '', direction: 'invite', past: false,
          eventTitle: title,
          primary: personName(row.invitedBy) + ' invited you to be an admin of ' + title,
          secondary: eventSecondary(evId) || title,
          row: row
        });
      });
    });
    return out;
  }
  function liveCocreators(){
    var who = me(), out = [];
    var mine = who;
    var requests = root.COREQUESTS || {};
    Object.keys(requests).forEach(function(evId){
      var manage = typeof root.canManageEvent === 'function' && root.canManageEvent(evId);
      if (!manage) return;
      Object.keys(requests[evId] || {}).forEach(function(pid){
        if (!requests[evId][pid] || pid === mine || pid === 'self') return;
        var title = eventTitle(evId);
        out.push({
          id: 'coreq:' + evId + ':' + pid,
          eventId: evId, personId: pid, direction: 'request', past: false,
          eventTitle: title,
          primary: personName(pid) + ' asked to be listed as a co-creator of ' + title,
          secondary: eventSecondary(evId) || title
        });
      });
    });
    var invites = root.COINVITES || {};
    if (who){
      Object.keys(invites).forEach(function(evId){
        (invites[evId] || []).forEach(function(row){
          if (!row || row.inviteeId !== who) return;
          var title = eventTitle(evId);
          out.push({
            id: 'coinv:' + evId + ':' + (row.invitedBy || 'x'),
            eventId: evId, personId: row.invitedBy || '', direction: 'invite', past: false,
            eventTitle: title,
            primary: personName(row.invitedBy) + ' invited you to co-create ' + title,
            secondary: eventSecondary(evId) || title
          });
        });
      });
    }
    return out;
  }

  function pending(rows){
    return rows.filter(function(item){ return item && !done[item.id]; });
  }
  function dedupe(rows){
    var seen = {}, out = [];
    rows.forEach(function(item){
      if (!item || seen[item.id]) return;
      seen[item.id] = true;
      out.push(item);
    });
    return out;
  }

  function acceptEvent(item){
    var snap = snapRole(item.eventId);
    var rsvp = bag('RSVP'), role = bag('ROLE'), went = bag('WENT');
    rsvp[item.eventId] = 'going';
    role[item.eventId] = 'attendee';
    if (item.past){
      went[item.eventId] = true;
      if (root.ONLINE && root.HNAPI && root.HNAPI.addChronicle) root.HNAPI.addChronicle(item.eventId);
    } else if (root.ONLINE && root.HNAPI && root.HNAPI.rsvp){
      root.HNAPI.rsvp(item.eventId, { role: 'attendee' });
    }
    mark(item, 'accept', snap);
    changed();
    return Promise.resolve();
  }
  function declineEvent(item){
    /* TODO: no DELETE /api/events/:id/invites for the invitee. Decline stays on this client. */
    mark(item, 'decline', snapRole(item.eventId));
    changed();
    return Promise.resolve();
  }
  function undoEvent(item){
    var row = done[item.id];
    if (row && row.snap) restoreRole(item.eventId, row.snap);
    if (row && row.verb === 'accept' && root.ONLINE && root.HNAPI && root.HNAPI.rsvp && !item.past) root.HNAPI.rsvp(item.eventId);
    /* TODO: no endpoint removes a chronicle row after a past invite was accepted. */
    forget(item.id);
    changed();
    return Promise.resolve();
  }

  function adminRow(item, status){
    var rows = bag('EVENT_ADMINS')[item.eventId] || (bag('EVENT_ADMINS')[item.eventId] = []);
    var who = me();
    var row = rows.filter(function(a){ return a && (a.userId === who || a === item.row); })[0];
    if (!row){
      row = { userId: who, invitedBy: item.personId, status: 'pending' };
      rows.push(row);
    }
    item.row = row;
    row.status = status;
    return { rows: rows, row: row };
  }
  function acceptAdmin(item){
    var found = adminRow(item, 'pending');
    var snap = { status: 'pending', had: true };
    found.row.status = 'accepted';
    if (root.ONLINE && root.HNAPI && root.HNAPI.answerAdmin) root.HNAPI.answerAdmin(item.eventId, 'accepted');
    mark(item, 'accept', snap);
    changed();
    return Promise.resolve();
  }
  function declineAdmin(item){
    var found = adminRow(item, 'pending');
    var snap = { status: 'pending', row: found.row, rows: found.rows };
    found.rows.splice(found.rows.indexOf(found.row), 1);
    if (root.ONLINE && root.HNAPI && root.HNAPI.answerAdmin) root.HNAPI.answerAdmin(item.eventId, 'declined');
    mark(item, 'decline', snap);
    changed();
    return Promise.resolve();
  }
  function undoAdmin(item){
    var row = done[item.id];
    var snap = row && row.snap;
    if (snap && snap.row){
      snap.row.status = 'pending';
      if (snap.rows && snap.rows.indexOf(snap.row) < 0) snap.rows.push(snap.row);
    } else if (item.row) item.row.status = 'pending';
    /* TODO: no endpoint returns an answered admin invite to pending. */
    forget(item.id);
    changed();
    return Promise.resolve();
  }

  function policyOf(evId){
    if (typeof root.cocreatorPolicyOf === 'function') return root.cocreatorPolicyOf(evId);
    var e = eventOf(evId);
    return e && e.cocreatorPolicy === 'request' ? 'request' : 'open';
  }
  function acceptCocreator(item){
    var snap = { direction: item.direction, requests: null, chron: null, role: bag('ROLE')[item.eventId], rsvp: bag('RSVP')[item.eventId] };
    if (item.direction === 'request'){
      var reqs = bag('COREQUESTS');
      snap.requests = !!(reqs[item.eventId] && reqs[item.eventId][item.personId]);
      if (reqs[item.eventId]) delete reqs[item.eventId][item.personId];
      var chron = bag('CHRON');
      snap.chron = chron[item.personId] && chron[item.personId][item.eventId];
      (chron[item.personId] = chron[item.personId] || {})[item.eventId] = 'cocreator';
      if (root.ONLINE && root.HNAPI && root.HNAPI.reviewCocreator) root.HNAPI.reviewCocreator(item.eventId, item.personId, 'approve');
    } else {
      bag('ROLE')[item.eventId] = 'cocreator';
      if (!bag('RSVP')[item.eventId]) bag('RSVP')[item.eventId] = 'going';
      /* TODO: no endpoint accepts a co-creator invite. PUT /rsvp {role:cocreator} is a self-claim and follows cocreator_policy. */
      if (root.ONLINE && root.HNAPI && root.HNAPI.rsvp && policyOf(item.eventId) === 'open') root.HNAPI.rsvp(item.eventId, { role: 'cocreator' });
    }
    mark(item, 'accept', snap);
    changed();
    return Promise.resolve();
  }
  function declineCocreator(item){
    var snap = { direction: item.direction };
    if (item.direction === 'request'){
      var reqs = bag('COREQUESTS');
      snap.had = !!(reqs[item.eventId] && reqs[item.eventId][item.personId]);
      if (reqs[item.eventId]) delete reqs[item.eventId][item.personId];
      if (root.ONLINE && root.HNAPI && root.HNAPI.reviewCocreator) root.HNAPI.reviewCocreator(item.eventId, item.personId, 'decline');
    }
    /* TODO: no endpoint declines a co-creator invite. */
    mark(item, 'decline', snap);
    changed();
    return Promise.resolve();
  }
  function undoCocreator(item){
    var row = done[item.id], snap = row && row.snap || {};
    if (item.direction === 'request'){
      if (snap.had || snap.requests){
        var reqs = bag('COREQUESTS');
        (reqs[item.eventId] = reqs[item.eventId] || {})[item.personId] = 1;
      }
      var chron = bag('CHRON');
      if (chron[item.personId]){
        if (snap.chron) chron[item.personId][item.eventId] = snap.chron;
        else delete chron[item.personId][item.eventId];
      }
    } else {
      var role = bag('ROLE'), rsvp = bag('RSVP');
      if (snap.role) role[item.eventId] = snap.role; else delete role[item.eventId];
      if (snap.rsvp) rsvp[item.eventId] = snap.rsvp; else delete rsvp[item.eventId];
    }
    /* TODO: no endpoint restores a reviewed co-creator request. */
    forget(item.id);
    changed();
    return Promise.resolve();
  }

  function provider(type, label, rows, accept, decline, undo){
    return {
      type: type,
      label: label,
      list: function(){ return pending(dedupe(rows())); },
      count: function(){ return pending(dedupe(rows())).length; },
      render: function(item){ return face(type, item); },
      accept: accept,
      decline: decline,
      undo: undo
    };
  }

  var eventProvider = provider('event_invite', 'Event invites', function(){ return offlineEvents().concat(liveEvents()); }, acceptEvent, declineEvent, undoEvent);
  var adminProvider = provider('admin_invite', 'Admin invites', function(){ return offlineAdmins().concat(liveAdmins()); }, acceptAdmin, declineAdmin, undoAdmin);
  var cocoProvider = provider('cocreator_request', 'Co-creator requests', function(){ return offlineCocreators().concat(liveCocreators()); }, acceptCocreator, declineCocreator, undoCocreator);

  function release(){
    offs.forEach(function(off){ if (typeof off === 'function') off(); });
    offs = [];
  }
  function registerNow(){
    var rel = root.HNRel;
    if (!(rel && typeof rel.registerRequestProvider === 'function')) return false;
    release();
    [eventProvider, adminProvider, cocoProvider].forEach(function(p){
      var off = rel.registerRequestProvider(p);
      if (typeof off === 'function') offs.push(off);
    });
    return true;
  }
  function arm(){
    if (registerNow()) return;
    if (hooked) return;
    hooked = true;
    var current = root.HNRel;
    try {
      Object.defineProperty(root, 'HNRel', {
        configurable: true,
        enumerable: true,
        get: function(){ return current; },
        set: function(next){ current = next; registerNow(); }
      });
    } catch (e) {}
  }

  function inviteRoles(canManage){
    return canManage ? ['guest', 'cocreator', 'admin'] : ['guest'];
  }
  var ROLE_LABEL = { guest: 'Guest', cocreator: 'Co-creator', admin: 'Admin' };
  function rolePickerHTML(canManage){
    return '<div class="ccrole" role="radiogroup" aria-label="Role">' + inviteRoles(!!canManage).map(function(role, i){
      return '<label><input type="radio" name="iv-role" value="'+role+'"'+(i === 0 ? ' checked' : '')+'> '+ROLE_LABEL[role]+'</label>';
    }).join('') + '</div>';
  }
  function recordSent(type, evId, pid){
    var who = me();
    if (type === 'event_invite'){
      var rows = bag('EVENT_INVITES')[evId] || (bag('EVENT_INVITES')[evId] = []);
      if (!rows.some(function(r){ return r.inviteeId === pid; })) rows.push({ inviteeId: pid, invitedBy: who });
    } else if (type === 'admin_invite'){
      var admins = bag('EVENT_ADMINS')[evId] || (bag('EVENT_ADMINS')[evId] = []);
      if (!admins.some(function(a){ return a.userId === pid; })) admins.push({ userId: pid, invitedBy: who, status: 'pending' });
    } else {
      var inv = bag('COINVITES')[evId] || (bag('COINVITES')[evId] = []);
      if (!inv.some(function(r){ return r.inviteeId === pid; })) inv.push({ inviteeId: pid, invitedBy: who, at: Date.now() });
    }
  }
  function send(opts){
    opts = opts || {};
    var role = opts.role === 'admin' || opts.role === 'cocreator' || opts.role === 'guest' ? opts.role : 'guest';
    if ((role === 'admin' || role === 'cocreator') && !opts.canManage) role = 'guest';
    if (role === 'guest' && !opts.canInvite) return null;
    var type = role === 'admin' ? 'admin_invite' : role === 'cocreator' ? 'cocreator_request' : 'event_invite';
    if (typeof root.deliverEventInvite === 'function') root.deliverEventInvite(type, opts.eventId, opts.personId, 'invite');
    else recordSent(type, opts.eventId, opts.personId);
    changed();
    return { type: type, direction: 'invite', eventId: opts.eventId, personId: opts.personId };
  }

  root.EventRequests = {
    inviteRoles: inviteRoles,
    rolePickerHTML: rolePickerHTML,
    send: send,
    register: registerNow,
    changed: changed
  };
  arm();
})(typeof window !== 'undefined' ? window : globalThis);
