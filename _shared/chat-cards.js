/* Chat cards, keyed by card_type. horizon_invite is the only one.
   Add a type here (phrase, link, accept, decline, api), in lib/chat-cards.ts, and in the
   list in db/migrations/0007_horizon_collaborators.sql. Its accept and decline route is its own file.
   A friend request is never a chat card. */
var ChatCards = (function(){
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function nameOf(m){
    return (m && (m.cardName || (m.cardId && typeof HORIZONS !== 'undefined' && HORIZONS[m.cardId] && HORIZONS[m.cardId].name))) || '';
  }
  function horizonPhrase(m){
    var raw = (m && m.invite) || 'pending';
    var follower = raw.indexOf('follower') >= 0;
    var state = String(raw).split(' ')[0];
    var name = nameOf(m);
    var tail = name ? ' ' + name : '';
    if (follower){
      if (state === 'pending' && m.from !== 'self') return 'Follow ' + name;
      if (state === 'pending') return 'Invite sent to follow' + tail;
      if (state === 'accepted') return 'Following' + tail;
      if (state === 'declined') return 'Declined to follow' + tail;
      if (state === 'cancelled') return 'Cancelled' + tail;
      return raw;
    }
    if (state === 'pending' && m.from !== 'self') return 'Collaborate on ' + name;
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
    phrase: horizonPhrase,
    link: function(m){ return m && m.cardId ? { type:'horizon', id:m.cardId } : null; },
    pending: function(m, me){ return !me && String((m && m.invite) || 'pending').split(' ')[0] === 'pending'; },
    accept: function(cid, id){ acceptHzInvite(cid, id); },
    decline: function(cid, id){ declineHzInvite(cid, id); },
    api: {
      accept: function(id){ return { method:'POST', path:'/api/horizons/' + id + '/invites' }; },
      decline: function(id){ return { method:'DELETE', path:'/api/horizons/' + id + '/invites' }; }
    },
    read: function(row, m){
      row.invite = m.body;
      row.text = (m.body === 'pending' || m.body === 'pending follower') ? (m.cardName || m.body) : m.body;
    }
  };
  horizonInvite.render = function(m, me, cid){
    var html = phraseHTML(m, horizonInvite.phrase(m), horizonInvite.link(m));
    if (!horizonInvite.pending(m, me)) return html;
    return '<span class="hzinv">'+html+'</span><span class="hzacts"><button type="button" class="btn" data-act="hzaccept" data-card="horizon_invite" data-id="'+esc(m.cardId)+'" data-chat="'+esc(cid)+'">Accept</button><button type="button" class="btn" data-act="hzdecline" data-card="horizon_invite" data-id="'+esc(m.cardId)+'" data-chat="'+esc(cid)+'">Decline</button></span>';
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
