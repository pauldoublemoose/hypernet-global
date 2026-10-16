/* Hypernet — the prototype's data layer on the real backend (Next.js API → Neon Postgres).
   ---------------------------------------------------------------------------------------------------------------
   index.html keeps all its state in globals (PEOPLE, EVENTS, REC, HORIZONS, CALLOUTS, RSVP, PFOLLOW, CHATS …) and
   draws from them. This file fills those globals from the server and sends every change back. It is loaded after
   the fixtures and before the app's own script; index.html calls into it from its data layer only (boot, persist,
   accounts, and one line in each action). Everything visual stays in index.html.

   Two modes, decided once at load:
     online   served by the Next app (it adds window.HN_BACKEND to the page) and no ?offline=1 in the URL.
              The fixtures are not used: everything comes from GET /api/bootstrap, and every action is a request.
     offline  anything else (a static server, file routing in tests/regression.js, ?offline=1): the fixtures and
              localStorage, exactly as before. Nothing here runs except the image check below.

   Writes are optimistic: the app changes its globals and redraws at once, then this file sends the change. Writes
   to the same thing go out in order. If one fails, a quiet toast says so and the whole state is reloaded from the
   server — that is the rollback, and it can never disagree with the database.
   Ids of new things (events, horizons, call outs, replies, messages) are made here (crypto.randomUUID), so a thing
   has its final id the moment it appears. */
(function(){
  'use strict';
  var HN = window.HNAPI = { online:false };

  /* pictures uploaded to our storage bucket are images a look may carry (HN_IMAGE accepts only data URLs) */
  var STORAGE_IMG = /^https:\/\/br-[a-z0-9-]+\.storage\.c-[0-9]+\.[a-z0-9-]+\.aws\.neon\.tech\/images\/[A-Za-z0-9\/_.-]+$/;
  var imageOk = window.HN_IMAGE;
  if (imageOk) window.HN_IMAGE = function(v){ return imageOk(v) || (typeof v === 'string' && STORAGE_IMG.test(v) ? v : null); };

  HN.online = !!window.HN_BACKEND && !/[?&]offline=1(&|$)/.test(location.search) && location.protocol !== 'file:';
  HN.branch = window.HN_BACKEND ? window.HN_BACKEND.branch : null;
  if (!HN.online) return;

  /* ---------- requests ---------- */
  function req(method, path, body){
    var init = { method:method, credentials:'same-origin', headers:{} };
    if (body !== undefined){ init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
    return fetch(path, init).then(function(r){
      return r.text().then(function(t){
        var j = null; try { j = t ? JSON.parse(t) : null; } catch(e){}
        if (!r.ok){
          var err = new Error((j && (j.message || (j.issues && j.issues[0] && j.issues[0].message) || j.error)) || ('Server answered ' + r.status));
          err.status = r.status; err.code = j && (j.error || j.code); throw err;
        }
        return j;
      });
    });
  }
  HN.req = req;
  HN.uuid = function(){
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function(x){ return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
  };
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  HN.isId = function(id){ return UUID.test(String(id || '')); };

  /* writes: in order per key, failures reload the truth */
  var QUEUE = {}, INFLIGHT = 0, FAILED = false;
  function write(key, method, path, body, what){
    INFLIGHT++;
    var run = function(){ return req(method, path, typeof body === 'function' ? body() : body); };
    var p = (QUEUE[key] || Promise.resolve()).then(run, run);
    QUEUE[key] = p.catch(function(){});
    return p.then(function(r){ INFLIGHT--; return r; }, function(err){
      INFLIGHT--;
      if (err.status === 401){ toast('You’re logged out', 'Log in again to keep changes.'); HN.refresh(); return null; }
      toast('Couldn’t save' + (what ? ' · ' + what : ''), err.message);
      FAILED = true; setTimeout(function(){ if (FAILED){ FAILED = false; HN.refresh(); } }, 600);
      return null;
    });
  }
  HN.write = write;

  /* ---------- the bootstrap → the app's globals ---------- */
  var GREYS = ['#4b4b4b','#6b6b6b','#363636','#7c7c7c','#565656','#2b2b2b','#1c1c1c'];
  var EVP = {};                    /* event id -> [{pid, verb, ms}] of everyone else */
  var HAS = {};                    /* event id -> going count including me */
  HN.me = null; HN.login = null;
  function meId(){ return HN.me ? HN.me.id : null; }
  function fill(obj, src){ Object.keys(obj).forEach(function(k){ delete obj[k]; }); Object.assign(obj, src); return obj; }
  function clock(iso){ var d = new Date(iso); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function ms(iso){ var t = Date.parse(iso || ''); return isNaN(t) ? 0 : t; }
  function cleanLookOrNull(l){ return l ? asLook(l) : null; }

  function personRow(p){
    var cities = p.cities || [];
    /* joinedAt: when the account was made (Home's "N people joined Hypernet", Explore → People newest first) */
    return { id:p.id, displayName:p.displayName, handle:p.handle, bio:p.bio || '', skills:(p.skills || []).slice(), cities:cities.slice(),
             city: cities[0] ? String(cities[0]).toUpperCase() : '', joinedAt: ms(p.createdAt) };
  }
  function eventRows(e){
    var det = e.details || {}, r = Object.assign({}, det);
    delete r._kind;
    Object.assign(r, { kind:e.kind, date:e.startsOn, title:e.title, description:e.description, hostName:e.hostName, privacy:e.privacy,
      endDate:e.endsOn || undefined, startTime:e.startTime || undefined, endTime:e.endTime || undefined, timezone:e.timezone,
      city:e.city || undefined, region:e.region || undefined, country:e.country || undefined, venue:e.venue || undefined,
      access:e.access || undefined, whatToBring:e.whatToBring || [] });
    if (!r.venueKind) r.venueKind = e.city || e.venue ? 'physical' : undefined;
    var ev = { id:e.id, slug:e.slug, title:e.title, date:e.startsOn, description:e.description, hostName:e.hostName, hostId:e.hostId,
               privacy:e.privacy, city:e.city || '', kind: det._kind || (e.source === 'import' ? 'real' : e.source === 'link' ? 'link' : 'own'), ownerIds:[], source:e.source,
               sourceUrl:e.sourceUrl || undefined, addedBy:e.addedBy || undefined };
    return { ev:ev, rec:r };
  }
  function chatRows(list, me){
    var byId = {}, order = [], unread = {};
    (list || []).forEach(function(c){
      if (!PEOPLE[c.personId]) return;
      var cid = 'c-dm-' + c.personId, last = c.messages[c.messages.length - 1];
      byId[cid] = { id:cid, name:PEOPLE[c.personId].displayName, kind:'dm', memberIds:[c.personId],
        messages: c.messages.map(function(m){ return { id:m.id, from: m.senderId === me ? 'self' : m.senderId, t:clock(m.createdAt), ts:m.createdAt, text:m.body }; }) };
      order.push(cid);
      if (last && last.senderId !== me && (!c.lastReadAt || ms(last.createdAt) > ms(c.lastReadAt))) unread[cid] = true;
    });
    order.sort(function(a, b){ return msgTs(lastMsg(byId[b])) - msgTs(lastMsg(byId[a])); });
    return { byId:byId, order:order, unread:unread };
  }

  function apply(d){
    var me = d.me ? d.me.id : null;
    HN.me = d.me; HN.login = d.login; HN.data = d;
    /* who you are */
    if (d.me){ S.loggedIn = true; S.acct = 'me'; S.me = { name:d.me.displayName, handle:d.me.handle }; ACCTS = { me:{ profile:personRow(d.me) } }; }
    else { S.loggedIn = false; S.acct = null; S.me = { name:'You', handle:'you' }; ACCTS = {}; }
    /* people */
    var P = {}, PT = {}, AV = {}, PR = {};
    d.people.forEach(function(p, i){
      P[p.id] = personRow(p); AV[p.id] = GREYS[i % GREYS.length];
      if (p.look) PT[p.id] = asLook(p.look);
      var seen = Date.now() - ms(p.lastSeenAt);
      if (p.lastSeenAt && seen < 10 * 60000) PR[p.id] = 'online'; else if (p.lastSeenAt && seen < 60 * 60000) PR[p.id] = 'idle';
    });
    P.self = d.me ? Object.assign(personRow(d.me), { id:'self' }) : { id:'self', displayName:'', handle:'', bio:'', skills:[], cities:[], city:'' };
    if (me){ if (PT[me]) PT.self = PT[me]; AV.self = AV[me] || '#1c1c1c'; delete P[me]; delete PT[me]; }
    fill(PEOPLE, P); fill(PTHEME, PT); fill(AVCOLOR, AV); fill(PRESENCE, PR);
    window.CREW = []; window.DEMOHOST = []; fill(GROUPS, {});
    /* who follows whom */
    var NF = {}, PF = {};
    d.follows.forEach(function(f){ (NF[f[0]] = NF[f[0]] || []).push(f[1]); if (f[0] === me) PF[f[1]] = true; });
    window.NETFOLLOWS = NF; window.PFOLLOW = PF;
    /* events */
    var E = {}, R = {}, T = window.HYPERNET_THEMES.themes, NX = {}, real = [];
    fill(T, {});
    d.events.forEach(function(e){
      var x = eventRows(e); E[e.id] = x.ev; R[e.id] = x.rec;
      if (e.look) T[e.id] = asLook(e.look);
      if (e.source === 'import' && !(e.details && e.details.illustrative)) real.push(e.id);
    });
    d.events.forEach(function(e){
      if (e.previousEditionId && E[e.previousEditionId]){ NX[e.previousEditionId] = e.id; R[e.id]._prev = e.previousEditionId; R[e.id]._prevYear = R[e.id]._prevYear || E[e.previousEditionId].date.slice(0, 4); }
    });
    fill(EVENTS, E); fill(REC, R); fill(NEXTED, NX); fill(PLAINCACHE, {});
    window.REALIDS = real.map(function(id){ return NX[id] || id; });
    window.MYEVENTS = d.events.filter(function(e){ return me && e.hostId === me; }).map(function(e){ return e.id; });
    window.ADDEDBYME = d.events.filter(function(e){ return me && e.source === 'link' && e.addedBy === me; }).map(function(e){ return e.id; });
    window.EDITED = {}; window.DELETED = { events:[], horizons:[] }; window.SLUGS = null;
    /* RSVPs and promotions */
    var RS = {}, WT = {}, SH = {}, PM = {}, PC = {};
    EVP = {}; HAS = {};
    d.rsvps.forEach(function(r){
      if (r.personId === me){ if (r.status) RS[r.eventId] = r.status; if (r.went) WT[r.eventId] = true; if (r.shiftIndex != null) SH[r.eventId] = r.shiftIndex; }
      else if (r.status) (EVP[r.eventId] = EVP[r.eventId] || []).push({ pid:r.personId, verb:r.status, ms:ms(r.updatedAt) });
    });
    d.promotions.forEach(function(p){ if (p[0] === me) PM[p[1]] = true; else PC[p[1]] = (PC[p[1]] || 0) + 1; });
    window.RSVP = RS; window.WENT = WT; window.SHIFT = SH; window.PROMOTED = PM; window.PROMOCOUNT = PC;
    /* horizons */
    var HZ = {}, HC = {}, HT = {}, HV = {}, HF = {}, mine = [];
    d.hzFollows.forEach(function(f){ if (f[0] === me) HF[f[1]] = true; });
    d.horizons.forEach(function(h){
      var own = !!me && h.ownerId === me;
      HZ[h.id] = { id:h.id, slug:h.slug, name:h.name, description:h.description || '', isPersonalDefault:!!h.isPersonalDefault, isPublished:!!h.publishedAt,
        ownerName: own ? d.me.displayName : (h.ownerName || (h.ownerId && P[h.ownerId] ? P[h.ownerId].displayName : 'Hypernet')),
        ownerId:h.ownerId, ownerAcct: own ? 'me' : undefined, eventIds:(h.eventIds || []).slice() };
      HC[h.id] = Math.max(0, (h.followers || 0) - (HF[h.id] ? 1 : 0));
      if (h.look) HT[h.id] = asLook(h.look);
      if (own) mine.push(h.id);
    });
    fill(HORIZONS, HZ); fill(HZCOUNT, HC); fill(HZTHEME, HT);
    d.horizons.forEach(function(h){ if (h.coverEventId && E[h.coverEventId]) HV[h.id] = h.coverEventId; else if (HT[h.id] && hzOwnsSquare(h.id, HT[h.id])) HV[h.id] = 'own'; });
    fill(HZCOVER, HV);
    window.HZFOLLOW = HF; window.MYHORIZONS = mine;
    /* call outs and their replies */
    window.CALLOUTS = d.callouts.map(function(c){
      var own = !!me && c.authorId === me;
      return { id:c.id, title:c.title, body:c.body || '', expiresAt:c.expiresOn, eventId:c.eventId || null, skill:c.skill || null, closed:!!c.closedAt,
               hostName: own ? d.me.displayName : (P[c.authorId] ? P[c.authorId].displayName : ''), hostId:c.authorId, hostAcct: own ? 'me' : undefined };
    });
    window.REPLIES = []; window.REPLYGONE = {};
    /* the network's activity (the view), shaped like the app's own rows */
    var rows = d.activity.map(function(a){
      return { id:'a-' + a.verb + '-' + a.actor + '-' + a.objId + '-' + ms(a.ts), actor:a.actor, verb:a.verb, objType:a.objType, objId:a.objId, ts:a.ts, extra:a.extra || null };
    });
    var replies = d.replies.map(function(r){ return { id:r.id, calloutId:r.calloutId, author:r.authorId, text:r.text, ts:r.createdAt }; });
    window.ACTSEED = { key:'online', rows:rows, replies:replies };
    window.LIVEACT = [];
    /* chats */
    var ch = chatRows(d.chats, me);
    window.CHATS = ch.byId; window.CHATORDER = ch.order; window.UNREADCHAT = ch.unread;
    if (S.chatOpen && !CHATS[S.chatOpen]) S.chatOpen = null;
    /* what is open still exists */
    S.stack = (S.stack || []).filter(validItem);
  }
  HN.apply = apply;
  /* one event from the server (an answer to Autofill or to adding a link) into the app's records */
  HN.takeEvent = function(e){
    if (!e || !e.id) return;
    var x = eventRows(e); EVENTS[e.id] = x.ev; REC[e.id] = x.rec;
    if (e.look) window.HYPERNET_THEMES.themes[e.id] = asLook(e.look);
    if (e.source === 'link' && e.addedBy === meId() && ADDEDBYME.indexOf(e.id) < 0) ADDEDBYME.push(e.id);
    SLUGS = null;
  };

  /* the activity rows (seedActivity) and the people on an event (eventPeople), from the server */
  HN.activity = function(){ return ACTSEED.rows; };
  HN.eventPeople = function(evId){ return (EVP[evId] || []).filter(function(x){ return PEOPLE[x.pid]; }).map(function(x){ return { pid:x.pid, verb:x.verb, ms:x.ms }; }); };
  HN.going = function(evId){ return (EVP[evId] || []).filter(function(x){ return x.verb === 'going' && PEOPLE[x.pid]; }).map(function(x){ return x.pid; }); };
  HN.goingCount = function(evId){ return HN.going(evId).length + (S.loggedIn && RSVP[evId] === 'going' ? 1 : 0); };
  HN.network = function(){ var me = meId(); return Object.keys(PEOPLE).filter(function(k){ return k !== 'self' && k !== me; }); };

  /* ---------- boot and refresh ---------- */
  var BOOTED = false, LASTLOAD = 0;
  HN.load = function(){ return req('GET', '/api/bootstrap').then(function(d){ LASTLOAD = Date.now(); return d; }); };
  HN.boot = function(start){
    HN.restoreUi();
    HN.load().then(function(d){ apply(d); BOOTED = true; start(); if (!d.me && d.login) setTimeout(function(){ profileDialog('signup'); }, 0); },
      function(err){
        BOOTED = true; start();
        toast('Hypernet can’t reach its server', err.message, { label:'Retry', run:function(){ HN.refresh(); } });
      });
  };
  /* reload everything from the server, keeping where you are (not while a change is still on its way) */
  HN.refresh = function(){
    if (INFLIGHT > 0){ setTimeout(HN.refresh, 400); return Promise.resolve(); }
    return HN.load().then(function(d){ apply(d); render(); return d; },
      function(err){ toast('Couldn’t reload', err.message, { label:'Retry', run:function(){ HN.refresh(); } }); });
  };
  /* the page comes back to the front: fresh data, at most once a minute */
  document.addEventListener('visibilitychange', function(){
    if (document.visibilityState === 'visible' && BOOTED && Date.now() - LASTLOAD > 60000 && !DLGS.length) HN.refresh();
  });
  /* new messages: every 20 s while you are logged in and looking */
  setInterval(function(){
    if (!BOOTED || !S.loggedIn || document.visibilityState !== 'visible' || INFLIGHT > 0) return;
    req('GET', '/api/chats').then(function(r){
      var me = meId(), ch = chatRows(r.chats, me), changed = false;
      Object.keys(ch.byId).forEach(function(cid){
        var cur = CHATS[cid], nw = ch.byId[cid];
        if (!cur){ CHATS[cid] = nw; CHATORDER.unshift(cid); changed = true; }
        else if (nw.messages.length > cur.messages.filter(function(m){ return m.id; }).length){ cur.messages = nw.messages; changed = true; }
        if (ch.unread[cid] && !UNREADCHAT[cid] && S.chatOpen !== cid){ UNREADCHAT[cid] = true; changed = true; }
      });
      if (changed){ var keep = $('chatbox') && $('chatbox').value; render(); var b = $('chatbox'); if (b && keep && !b.value) b.value = keep; }
    }, function(){});
  }, 20000);

  /* ---------- what stays in this browser: per-viewer conveniences only ---------- */
  var UIKEY = 'hypernet-feed:ui:v1', UISAVED = null;
  HN.persistUi = function(){
    var v = { ui:{ rightOpen:!!S.rightOpen, chatOpen:S.chatOpen || null, recent:RECENTQ }, read:READ, drafts:{ forms:FORMDRAFTS, chat:CHATDRAFT } };
    try { var j = JSON.stringify(v); if (j !== UISAVED && storeSet(UIKEY, j)) UISAVED = j; } catch(e){}
  };
  HN.restoreUi = function(){
    var d = null; try { d = JSON.parse(localStorage.getItem(UIKEY) || 'null'); } catch(e){}
    if (!d) return;
    if (d.ui){ S.rightOpen = !!d.ui.rightOpen; S.chatOpen = d.ui.chatOpen || null; RECENTQ = d.ui.recent || []; }
    if (d.read) Object.keys(d.read).forEach(function(k){ READ[k] = true; });
    if (d.drafts){ FORMDRAFTS = d.drafts.forms || {}; CHATDRAFT = d.drafts.chat || {}; }
  };

  /* ---------- log in: email → 6-digit code → (first time) your profile ----------
     The code step (2026-10-05): ⚠ only with an error to say; no "Use another email" — Back returns to the email, kept, to
     fix a typo, and × closes; "Send a new code" waits RESEND seconds after a code went out, counting down, at the
     footer's left in line with Back and Log in */
  var LG = null, LGT = null, RESEND = 30;
  function resendLeft(){ return LG && LG.sentAt ? Math.max(0, RESEND - Math.floor((Date.now() - LG.sentAt) / 1000)) : 0; }
  function resendLabel(){ var n = resendLeft(); return LG.busy === 'send' ? 'Sending…' : 'Send a new code' + (n ? ' (0:' + ('0' + n).slice(-2) + ')' : ''); }
  /* the countdown changes only the button, so a half-typed code stays where it is */
  function tickResend(){
    clearInterval(LGT); LGT = null;
    if (!LG || LG.step !== 'code' || !resendLeft()) return;
    LGT = setInterval(function(){
      var b = document.querySelector('.dlg [data-hnact="resend"]');
      if (!LG || LG.step !== 'code' || !b){ clearInterval(LGT); LGT = null; return; }
      var n = resendLeft(); b.textContent = resendLabel(); b.disabled = !!n || !!LG.busy;
      if (!n){ clearInterval(LGT); LGT = null; }
    }, 1000);
  }
  function loginBody(){
    if (LG.step === 'email') return '<p class="fhelp" style="margin:0 0 12px">We email you a 6-digit code. No password, ever. New here? The same code makes your account.</p>' +
      '<div class="field"><label for="hn-email">Email</label><input type="email" id="hn-email" value="'+esc(LG.email)+'" placeholder="you@example.com" autocomplete="email" autocapitalize="off" spellcheck="false"></div>' +
      '<p class="ferr" id="hn-lerr" role="alert">'+esc(LG.err || '')+'</p>';
    return '<p class="fhelp" style="margin:0 0 12px">We sent '+(LG.resent ? 'a new code' : 'a code')+' to <b>'+esc(LG.email)+'</b>. It works for a few minutes.</p>' +
      '<div class="field"><label for="hn-otp">Code</label><input type="text" id="hn-otp" inputmode="numeric" autocomplete="one-time-code" maxlength="9" placeholder="123456" style="font-size:20px;letter-spacing:3px"></div>' +
      '<p class="ferr" id="hn-lerr" role="alert">'+esc(LG.err || '')+'</p>';
  }
  function loginFoot(){
    if (LG.step === 'email') return '<button class="btn" data-act="closedlg">Cancel</button>' +
      '<button class="btn primary" data-hnact="send"'+(LG.busy ? ' disabled' : '')+'>'+(LG.busy ? 'Sending…' : 'Email me a code')+'</button>';
    return '<button type="button" class="btn lgresend" data-hnact="resend"'+(resendLeft() || LG.busy ? ' disabled' : '')+'>'+resendLabel()+'</button>' +
      '<button type="button" class="btn" data-hnact="other"'+(LG.busy ? ' disabled' : '')+'>Back</button>' +
      '<button class="btn primary" data-hnact="verify"'+(LG.busy ? ' disabled' : '')+'>'+(LG.busy === 'verify' ? 'Checking…' : 'Log in')+'</button>';
  }
  function paintLogin(){
    var d = DLGS[DLGS.length - 1]; if (!d || !LG || !d.querySelector('#hn-login')) return;
    /* a code that turned out wrong stays in its field, to be checked ("Check it, or ask for a new one") */
    var otp = $('hn-otp'), typed = otp && LG.step === 'code' && LG.busy !== 'send' ? otp.value : '';
    d.querySelector('#hn-login').innerHTML = loginBody(); d.querySelector('.dfoot').innerHTML = loginFoot();
    if (typed && $('hn-otp')) $('hn-otp').value = typed;
    placeDlg(d); focusIn(LG.step === 'email' ? 'hn-email' : 'hn-otp');
    tickResend();
  }
  HN.loginDialog = function(){
    LG = { step:'email', email:(LG && LG.email) || '', err:'', busy:false };
    dialog(JOINFOR || 'Join or log in', '<div id="hn-login">' + loginBody() + '</div>', loginFoot(), 440);
    focusIn('hn-email');
  };
  function sendCode(){
    var inp = $('hn-email'), email = String(inp ? inp.value : LG.email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ LG.err = 'That doesn’t look like an email address.'; paintLogin(); return; }
    var again = LG.step === 'code';
    LG.email = email; LG.busy = 'send'; LG.err = ''; paintLogin();
    req('POST', '/api/auth/email-otp/send-verification-otp', { email:email, type:'sign-in' }).then(function(){
      LG.busy = false; LG.step = 'code'; LG.sentAt = Date.now(); LG.resent = again; paintLogin();
    }, function(err){ LG.busy = false; LG.err = err.status === 429 ? 'Too many codes asked for. Wait a minute, then try again.' : 'Couldn’t send the code: ' + err.message; paintLogin(); });
  }
  function verifyCode(){
    var otp = String(($('hn-otp') || {}).value || '').replace(/\D/g, '');
    if (otp.length !== 6){ LG.err = 'The code has 6 digits.'; paintLogin(); return; }
    LG.busy = 'verify'; LG.err = ''; paintLogin();
    req('POST', '/api/auth/sign-in/email-otp', { email:LG.email, otp:otp }).then(function(){
      return HN.load().then(function(d){
        LG = null; apply(d);
        if (d.me){ WELCOME = 'Welcome back, ' + d.me.displayName.split(' ')[0]; logIn(); if (WELCOME){ var w = WELCOME; WELCOME = null; toast(w, ''); } }
        else { closeDialogs(); render(); profileDialog('signup'); }
      });
    }, function(err){
      LG.busy = false;
      LG.err = /TOO_MANY|attempt/i.test(err.code + ' ' + err.message) ? 'Too many tries. Ask for a new code.' : /expired/i.test(err.message) ? 'That code has expired. Ask for a new one.' : 'That code isn’t right. Check it, or ask for a new one.';
      paintLogin();
    });
  }
  document.addEventListener('click', function(ev){
    var b = ev.target.closest && ev.target.closest('[data-hnact]'); if (!b || !LG) return;
    var a = b.getAttribute('data-hnact');
    if (LG.busy || b.disabled) return;
    if (a === 'send' || a === 'resend') sendCode();
    else if (a === 'verify') verifyCode();
    else if (a === 'other'){ LG.step = 'email'; LG.err = ''; paintLogin(); }   /* Back: the email, kept, to correct */
  });
  document.addEventListener('keydown', function(ev){
    if (ev.key !== 'Enter' || !LG || !ev.target || (ev.target.id !== 'hn-email' && ev.target.id !== 'hn-otp')) return;
    ev.preventDefault(); if (LG.busy) return;
    if (ev.target.id === 'hn-email') sendCode(); else verifyCode();
  });

  /* joining: the profile form (index.html's) is sent here instead of becoming a browser account */
  HN.join = function(prof, look){
    var b = $('pfsave'); if (b){ b.disabled = true; b.textContent = 'Joining…'; }
    var body = { handle:prof.handle, displayName:prof.displayName, bio:prof.bio || undefined, skills:prof.skills, cities:prof.cities };
    if (look) body.look = look;
    return req('POST', '/api/me', body).then(function(){ return HN.load(); }).then(function(d){
      apply(d); WELCOME = 'Welcome, ' + prof.displayName.split(' ')[0]; logIn();
      if (WELCOME){ var w = WELCOME; WELCOME = null; toast(w, ''); }
    }, function(err){
      if (b){ b.disabled = false; b.textContent = 'Join'; }
      if (err.code === 'handle_taken'){ var e = $('pf-herr'); if (e){ e.textContent = '@' + prof.handle + ' is taken'; e.hidden = false; } return; }
      toast('Couldn’t join', err.message);
    });
  };
  HN.saveProfile = function(prof){
    var body = { displayName:prof.displayName, handle:prof.handle, bio:prof.bio || null, skills:prof.skills, cities:prof.cities };
    return write('me', 'PATCH', '/api/me', body, 'your profile').then(function(r){ if (r === null) return; });
  };
  HN.saveMyLook = function(){ return write('me', 'PATCH', '/api/me', function(){ return { look: PTHEME.self ? lookOut(PTHEME.self) : null }; }, 'your look'); };
  HN.logout = function(){
    return req('POST', '/api/auth/sign-out', {}).catch(function(){}).then(function(){ return HN.load(); }).then(function(d){
      apply(d); S.chatOpen = null; S.rightOpen = false; goFolder(landingFolder()); closeDialogs(); closePopup(); render(); toast('Logged out', '');
    }, function(err){ toast('Couldn’t log out', err.message); });
  };

  /* ---------- images: a square picture goes to storage; the look keeps its URL ---------- */
  HN.upload = function(dataUrl){
    var m = /^data:(image\/[a-z+]+);base64,(.*)$/.exec(dataUrl || '');
    if (!m) return Promise.reject(new Error('Not an image'));
    var bin = atob(m[2]), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return req('POST', '/api/images', { contentType:m[1], bytes:bytes.length }).then(function(r){
      return fetch(r.upload.url, { method:r.upload.method, headers:r.upload.headers, body:new Blob([bytes], { type:m[1] }) }).then(function(up){
        if (!up.ok) throw new Error('Upload refused (' + up.status + ')');
        return r.url;
      });
    }).catch(function(err){ toast('Couldn’t upload the picture', err.status === 401 || err.status === 403 ? 'Log in first.' : err.message); throw err; });
  };

  /* ---------- the app's records → request bodies ---------- */
  /* a look as the API takes it: the colours the page wears (the database CHECK reads these) and, since 2026-10-05, the
     one to three picks they come from */
  function lookOut(t){
    if (!t) return null;
    var l = asLook(t), o = { bg:l.bg, ink:l.ink, accent:l.accent, image:l.image || null, glyph:l.glyph || null };
    if (l.colors) o.colors = l.colors;
    return o;
  }
  var COLS = ['id','title','date','endDate','startTime','endTime','timezone','privacy','hostName','description','whatToBring','kind','city','region','country','venue','access','_prev','_prevYear'];
  function eventBody(id){
    var e = EVENTS[id], r = REC[id] || {}, details = {};
    Object.keys(r).forEach(function(k){ if (COLS.indexOf(k) < 0 && r[k] !== undefined) details[k] = r[k]; });
    var city = String(r.city || e.city || '').trim();
    return { title:e.title, description:r.description || e.description || '', startsOn:e.date, endsOn:r.endDate || null,
      startTime:r.startTime || null, endTime:r.endTime || null, kind:r.kind || 'meetup', privacy:e.privacy || 'everyone',
      city: r.venueKind === 'virtual' ? null : (city || null), venue: r.venue || null, access: r.access || null,
      whatToBring: Array.isArray(r.whatToBring) ? r.whatToBring : [], details:details,
      look: lookOut(window.HYPERNET_THEMES.themes[id] || null) };
  }
  /* an event from a link: the same fields, plus where it came from and who puts it on (never who can see it: it is public) */
  function linkBody(id){
    var b = eventBody(id), e = EVENTS[id], r = REC[id] || {};
    delete b.privacy;
    ['externalUrl', 'sourceSite'].forEach(function(k){ delete b.details[k]; });
    return Object.assign(b, { sourceUrl:e.sourceUrl, hostName:e.hostName, timezone:r.timezone || undefined, region:r.region || null, country:r.country || null });
  }

  /* ---------- one call per action (index.html calls these right after it changed its own state) ---------- */
  function title(id){ return EVENTS[id] ? EVENTS[id].title : ''; }
  HN.createEvent = function(id){
    logAct('created_event', 'event', id);
    return write('ev:' + id, 'POST', '/api/events', Object.assign({ id:id }, eventBody(id)), title(id)).then(function(r){
      if (r && r.event && EVENTS[id]){ EVENTS[id].slug = r.event.slug; SLUGS = null; if (ROUTE.ready) render(); }
    });
  };
  HN.saveEvent = function(id){
    return write('ev:' + id, 'PATCH', '/api/events/' + id, function(){
      var b = eventBody(id);
      if (EVENTS[id] && EVENTS[id].kind === 'link'){ b.hostName = EVENTS[id].hostName; delete b.privacy; }
      return b;
    }, title(id));
  };
  /* Autofill: what the page says (nothing is saved), or the event this link already is */
  HN.autofill = function(url){ return req('POST', '/api/events/autofill', { url:url }); };
  /* add an event from a link; the server copies its picture. The same link added a moment ago by someone else answers
     with their event: this one is put away and theirs takes its place (in your horizon too) */
  HN.createLinkEvent = function(id, imageUrl){
    return write('ev:' + id, 'POST', '/api/events/link', Object.assign({ id:id, imageUrl:imageUrl || null }, linkBody(id)), title(id)).then(function(r){
      if (!r || !r.event) return;
      var got = r.event;
      if (got.id !== id){
        HN.takeEvent(got);
        Object.keys(HORIZONS).forEach(function(k){
          var ids = HORIZONS[k].eventIds, i = ids.indexOf(id);
          if (i >= 0){ if (ids.indexOf(got.id) >= 0) ids.splice(i, 1); else ids[i] = got.id; }
        });
        delete EVENTS[id]; delete REC[id];
        window.ADDEDBYME = ADDEDBYME.filter(function(x){ return x !== id; });
      } else {
        if (got.look) window.HYPERNET_THEMES.themes[id] = asLook(got.look);
        if (EVENTS[id]) EVENTS[id].slug = got.slug;
        SLUGS = null; delete PLAINCACHE[id];
      }
      if (ROUTE.ready) render();
    });
  };
  HN.saveEventLook = function(id){ return write('ev:' + id, 'PATCH', '/api/events/' + id, function(){ return { look: lookOut(window.HYPERNET_THEMES.themes[id] || null) }; }, title(id)); };
  HN.deleteEvent = function(id){ return write('ev:' + id, 'DELETE', '/api/events/' + id, undefined, 'the event'); };
  HN.rsvp = function(id){
    return write('rsvp:' + id, 'PUT', '/api/events/' + id + '/rsvp', function(){
      return { status: RSVP[id] || null, went: !!WENT[id], shiftIndex: SHIFT[id] == null ? null : SHIFT[id] };
    }, title(id));
  };
  HN.promote = function(id){ return write('promo:' + id, PROMOTED[id] ? 'PUT' : 'DELETE', '/api/events/' + id + '/promote', undefined, title(id)); };
  HN.followPerson = function(pid){
    if (!HN.isId(pid)) return Promise.resolve();
    return write('pf:' + pid, PFOLLOW[pid] ? 'PUT' : 'DELETE', '/api/people/' + pid + '/follow', undefined, person(pid).displayName);
  };
  HN.followHorizon = function(hzId){ return write('hf:' + hzId, HZFOLLOW[hzId] ? 'PUT' : 'DELETE', '/api/horizons/' + hzId + '/follow', undefined, (HORIZONS[hzId] || {}).name); };
  HN.createHorizon = function(hzId){
    var h = HORIZONS[hzId];
    return write('hz:' + hzId, 'POST', '/api/horizons', { id:hzId, name:h.name, description:h.description || '', published:!!h.isPublished,
      eventIds:h.eventIds.filter(HN.isId), look: HZTHEME[hzId] ? lookOut(HZTHEME[hzId]) : undefined }, h.name);
  };
  HN.saveHorizon = function(hzId){
    return write('hz:' + hzId, 'PATCH', '/api/horizons/' + hzId, function(){
      var h = HORIZONS[hzId]; return h ? { name:h.name, description:h.description || '', published:!!h.isPublished, look: HZTHEME[hzId] ? lookOut(HZTHEME[hzId]) : null } : {};
    }, (HORIZONS[hzId] || {}).name);
  };
  HN.horizonEvents = function(hzId){
    if (!HORIZONS[hzId] || !hzOwnedByMe(hzId)) return Promise.resolve();
    /* an event made a moment ago (New event, From a link) must exist on the server before the horizon lists it */
    var waits = HORIZONS[hzId].eventIds.map(function(id){ return QUEUE['ev:' + id]; }).filter(Boolean);
    if (waits.length) QUEUE['hz:' + hzId] = Promise.all([QUEUE['hz:' + hzId] || Promise.resolve()].concat(waits)).catch(function(){});
    return write('hz:' + hzId, 'PUT', '/api/horizons/' + hzId + '/events', function(){ return { eventIds:(HORIZONS[hzId] ? HORIZONS[hzId].eventIds : []).filter(HN.isId) }; }, HORIZONS[hzId].name);
  };
  HN.deleteHorizon = function(hzId){ return write('hz:' + hzId, 'DELETE', '/api/horizons/' + hzId, undefined, 'the horizon'); };
  HN.createCallout = function(id){
    var c = calloutOf(id);
    return write('co:' + id, 'POST', '/api/callouts', { id:id, title:c.title, body:c.body || '', eventId: HN.isId(c.eventId) ? c.eventId : null,
      skill:c.skill || null, expiresOn:c.expiresAt }, c.title);
  };
  HN.saveCallout = function(id){
    return write('co:' + id, 'PATCH', '/api/callouts/' + id, function(){
      var c = calloutOf(id); return { title:c.title, body:c.body || '', eventId: HN.isId(c.eventId) ? c.eventId : null, skill:c.skill || null, expiresOn:c.expiresAt, closed:!!c.closed };
    }, (calloutOf(id) || {}).title);
  };
  HN.postReply = function(r){ return write('re:' + r.id, 'POST', '/api/callouts/' + r.calloutId + '/replies', { id:r.id, text:r.text }, 'your reply'); };
  HN.deleteReply = function(id){ return write('re:' + id, 'DELETE', '/api/replies/' + id, undefined, 'the reply'); };
  /* undo of a deleted reply: post it again with the same id */
  HN.replyBack = function(id){
    var r = allReplies().filter(function(x){ return x.id === id; })[0]; if (!r) return Promise.resolve();
    return write('re:' + id, 'POST', '/api/callouts/' + r.calloutId + '/replies', { id:id, text:r.text }, 'the reply');
  };
  HN.sendMessage = function(cid, m){
    var pid = CHATS[cid] && CHATS[cid].memberIds[0]; if (!HN.isId(pid)) return Promise.resolve();
    m.id = m.id || HN.uuid();
    return write('chat:' + pid, 'POST', '/api/chats/' + pid + '/messages', { id:m.id, body:m.text }, 'your message');
  };
  HN.readChat = function(cid){
    var pid = CHATS[cid] && CHATS[cid].memberIds[0]; if (!HN.isId(pid) || !CHATS[cid].messages.length) return Promise.resolve();
    return write('chat:' + pid, 'PUT', '/api/chats/' + pid + '/read', undefined, null);
  };
})();
