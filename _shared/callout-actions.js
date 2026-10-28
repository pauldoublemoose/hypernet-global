/* Per-person Boost and Bookmark on call outs, plus the list Sidebar reads.
   HNCallouts is exactly mine, interacted, and onChange. */
(function(root){
  var listeners = [];

  function ping(){
    listeners.slice().forEach(function(fn){
      try { fn(); } catch (e) {}
    });
  }
  function key(){
    var acct = root.S && root.S.acct;
    return 'hypernet-feed:callouts:' + (acct || 'out');
  }
  function save(){
    if (typeof root.storeSet !== 'function') return false;
    return root.storeSet(key(), JSON.stringify({ boost: root.COBOOST || {}, mark: root.COMARK || {} }));
  }
  function load(){
    var raw = null;
    try {
      if (root.localStorage && typeof root.localStorage.getItem === 'function') raw = JSON.parse(root.localStorage.getItem(key()) || 'null');
    } catch (e) { raw = null; }
    root.COBOOST = raw && raw.boost && typeof raw.boost === 'object' ? raw.boost : {};
    root.COMARK = raw && raw.mark && typeof raw.mark === 'object' ? raw.mark : {};
  }
  function copy(c){
    var eventId = typeof root.calloutEventId === 'function' ? root.calloutEventId(c) : (c && c.eventId);
    return {
      id: c.id,
      title: c.title || '',
      body: c.body || '',
      eventId: eventId || null,
      skill: c.skill || null,
      expiresAt: c.expiresAt || null,
      closed: !!c.closed,
      hostId: c.hostId || null,
      hostName: c.hostName || '',
      hostAcct: c.hostAcct || null
    };
  }
  function isMine(c){
    if (typeof root.isOwnCallout === 'function') return !!root.isOwnCallout(c);
    var acct = root.S && root.S.acct;
    return !!(c && acct && c.hostAcct === acct);
  }
  function posted(c){
    if (typeof root.calloutPostedMs === 'function') return root.calloutPostedMs(c.id) || 0;
    return Number(c && c.createdAt) || 0;
  }
  function replyAt(c){
    var me = typeof root.myActor === 'function' ? root.myActor() : null;
    if (!me) return 0;
    var rows = typeof root.repliesOf === 'function' ? root.repliesOf(c.id) : (root.REPLIES || []).filter(function(r){ return r && r.calloutId === c.id; });
    var at = 0;
    (rows || []).forEach(function(r){
      if (!r || r.author !== me) return;
      var t = typeof root.isoMs === 'function' ? root.isoMs(r.ts) : (typeof r.ts === 'number' ? r.ts : Date.parse(r.ts) || 0);
      if (t > at) at = t;
    });
    return at;
  }
  function mine(){
    var list = (root.CALLOUTS || []).filter(isMine).slice().sort(function(a, b){ return posted(b) - posted(a); });
    return Promise.resolve(list.map(copy));
  }
  function interacted(){
    var boosts = root.COBOOST || {};
    var marks = root.COMARK || {};
    var rows = [];
    (root.CALLOUTS || []).forEach(function(c){
      if (!c || isMine(c)) return;
      var kinds = [];
      var at = 0;
      if (boosts[c.id]){ kinds.push('boost'); at = Math.max(at, Number(boosts[c.id]) || 0); }
      if (marks[c.id]){ kinds.push('bookmark'); at = Math.max(at, Number(marks[c.id]) || 0); }
      var reply = replyAt(c);
      if (reply){ kinds.push('reply'); at = Math.max(at, reply); }
      if (!kinds.length) return;
      rows.push({ callout: copy(c), kinds: kinds, at: at });
    });
    rows.sort(function(a, b){ return b.at - a.at; });
    return Promise.resolve(rows);
  }
  function onChange(fn){
    if (typeof fn !== 'function') return function(){};
    listeners.push(fn);
    return function off(){
      var i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  root.HNCallouts = { mine: mine, interacted: interacted, onChange: onChange };
  root.HNCalloutsPing = ping;
  root.HNCalloutStore = { save: save, load: load, key: key };
})(typeof window !== 'undefined' ? window : globalThis);
