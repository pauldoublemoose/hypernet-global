/* Chat cards, keyed by card_type. horizon_invite is the only one.
   Add a type here (phrase, link, accept, decline, api), in lib/chat-cards.ts, and in the
   IN list of the latest messages_card_type_check migration (0013_message_card_types.sql).
   Its accept and decline route is its own file.
   A friend request is never a chat card. */
var ChatCards = (function(){
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function nameOf(m){
    return (m && (m.cardName || (m.cardId && typeof HORIZONS !== 'undefined' && HORIZONS[m.cardId] && HORIZONS[m.cardId].name))) || '';
  }
  var HORIZON_KIND = 'horizon';
  function withKind(name){
    if (!name) return '';
    return HORIZON_KIND + ' ' + name;
  }
  function horizonPhrase(m){
    var raw = (m && m.invite) || 'pending';
    var follower = raw.indexOf('follower') >= 0;
    var state = String(raw).split(' ')[0];
    var name = nameOf(m);
    var tail = name ? ' ' + name : '';
    if (follower){
      if (state === 'pending' && m.from !== 'self') return 'Follow ' + withKind(name);
      if (state === 'pending') return 'Invite sent to follow' + tail;
      if (state === 'accepted') return 'Following' + tail;
      if (state === 'declined') return 'Declined to follow' + tail;
      if (state === 'cancelled') return 'Cancelled' + tail;
      return raw;
    }
    if (state === 'pending' && m.from !== 'self') return 'Collaborate on ' + withKind(name);
    if (state === 'pending') return 'Invite sent' + tail;
    var said = { accepted:'Accepted', declined:'Declined', cancelled:'Cancelled' }[state] || state;
    return said + tail;
  }
  function phraseHTML(m, phrase, link){
    var name = nameOf(m);
    var at = name ? phrase.lastIndexOf(name) : -1;
    if (!link || at < 0) return esc(phrase);
    return esc(phrase.slice(0, at)) + '<button type="button" class="hzname" data-act="open" data-type="'+esc(link.type)+'" data-id="'+esc(link.id)+'">'+esc(name)+'</button>' + esc(phrase.slice(at + name.length));
  }
  var horizonInvite = {
    kind: HORIZON_KIND,
    phrase: horizonPhrase,
    link: function(m){ return m && m.cardId ? { type:'horizon', id:m.cardId } : null; },
    pending: function(m, me){ return !me && String((m && m.invite) || 'pending').split(' ')[0] === 'pending'; },
    answered: function(m, me){
      if (me) return false;
      var state = String((m && m.invite) || 'pending').split(' ')[0];
      return state === 'accepted' || state === 'declined';
    },
    accept: function(cid, id){ respondHzInvite(cid, id, 'accept'); },
    decline: function(cid, id){ respondHzInvite(cid, id, 'decline'); },
    undo: function(cid, id, mid){ respondHzInvite(cid, id, 'undo', mid); },
    api: {
      accept: function(id){ return { method:'POST', path:'/api/horizons/' + id + '/invites' }; },
      decline: function(id){ return { method:'DELETE', path:'/api/horizons/' + id + '/invites' }; },
      undo: function(id){ return { method:'PATCH', path:'/api/horizons/' + id + '/invites' }; }
    },
    read: function(row, m){
      row.invite = m.body;
      row.text = (m.body === 'pending' || m.body === 'pending follower') ? (m.cardName || m.body) : m.body;
    }
  };
  function actBtn(act, label, m, cid){
    var mid = m && m.id ? ' data-mid="'+esc(m.id)+'"' : '';
    return '<button type="button" class="btn'+(act === 'hzundo' ? ' hzundo' : '')+'" data-act="'+act+'" data-card="horizon_invite" data-id="'+esc(m.cardId)+'" data-chat="'+esc(cid)+'"'+mid+'>'+label+'</button>';
  }
  function requestReady(m){
    if (!m || m.from === 'self') return false;
    if (typeof HorizonRequests === 'undefined' || !HorizonRequests || typeof HorizonRequests.registered !== 'function' || !HorizonRequests.registered()) return false;
    return !!(window.HNRel && typeof window.HNRel.openRequests === 'function');
  }
  function requestHTML(m, cid){
    var person = typeof PEOPLE !== 'undefined' && PEOPLE && PEOPLE[m.from];
    var name = (person && person.displayName) || '';
    return '<span class="hzinv">'+esc(name)+' sent you a <button type="button" class="hzreq" data-act="hzreq" data-id="'+esc(HorizonRequests.idOf(cid, m))+'">request</button></span>';
  }
  horizonInvite.render = function(m, me, cid){
    if (requestReady(m)) return requestHTML(m, cid);
    var html = phraseHTML(m, horizonInvite.phrase(m), horizonInvite.link(m));
    if (horizonInvite.pending(m, me)) return '<span class="hzinv">'+html+'</span><span class="hzacts">'+actBtn('hzaccept', 'Accept', m, cid)+actBtn('hzdecline', 'Decline', m, cid)+'</span>';
    if (horizonInvite.answered(m, me)) return '<span class="hzinv">'+html+'</span><span class="hzacts">'+actBtn('hzundo', 'Undo', m, cid)+'</span>';
    return html;
  };
  var cards = { horizon_invite: horizonInvite };
  function get(type){ return type && Object.prototype.hasOwnProperty.call(cards, type) ? cards[type] : null; }
  return {
    get: get,
    phrase: function(m){ var c = get(m && m.cardType); return c ? c.phrase(m) : null; },
    body: function(m, me, cid){
      var c = get(m && m.cardType);
      if (!c) return esc(m && m.text);
      return c.render(m, me, cid);
    }
  };
})();
